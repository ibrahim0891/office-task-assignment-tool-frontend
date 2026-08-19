"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import NotificationsTray from "./NotificationsTray";
import TaskModal from "./TaskModal";
import toast from "react-hot-toast";
import { CustomSelect } from "./ui/CustomSelect";
import { CustomDatePicker } from "./ui/CustomDatePicker";
import { TipTapEditor } from "./ui/TipTapEditor";
import { Button } from "./ui/Button";
import MemberProfileModal from "./MemberProfileModal";
import ManageTeamsModal from "./ManageTeamsModal";
import { useWorkspace } from "../context/WorkspaceContext";
import { api } from "../api";
import {
    Bell,
    Settings,
    RotateCcw,
    Sun,
    Moon,
    Palette,
    Type,
    Loader2,
} from "lucide-react";
import { APP_CONFIG } from "../config/appConfig";

const inputClass =
    "px-2.5 py-1.5 border border-[#E5E5E3] focus:border-[#1A1A1A] focus:outline-none text-[11px] bg-white rounded-[3px] transition-colors w-full";

const fontMap: Record<string, string> = {
    Outfit: "'Outfit', sans-serif",
    Lora: "'Lora', serif",
    Lexend: "'Lexend', sans-serif",
    "Instrument Serif": "'Instrument Serif', serif",
    "Caveat (Handwriting)": "'Caveat', cursive",
    "Dancing Script (Handwriting)": "'Dancing Script', cursive",
    "Pacifico (Handwriting)": "'Pacifico', cursive",
    "Darius (Bodoni)": "'Bodoni Moda', serif",
    "Cormorant Garamond": "'Cormorant Garamond', serif",
    "Playfair Display": "'Playfair Display', serif",
    Newsreader: "'Newsreader', serif",
    Cinzel: "'Cinzel', serif",
    Inter: "'Inter', sans-serif",
    Montserrat: "'Montserrat', sans-serif",
    "Space Grotesk": "'Space Grotesk', sans-serif",
    "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
    Roboto: "'Roboto', sans-serif",
    "Fira Code (Monospace)": "'Fira Code', monospace",
    "System Default": "system-ui, -apple-system, sans-serif",
};

const FONT_OPTIONS = [
    { value: "Outfit", label: "Outfit (Geometric - Default)" },
    { value: "Lora", label: "Lora (Serif)" },
    { value: "Lexend", label: "Lexend (Modern Sans)" },
    { value: "Inter", label: "Inter (Clean Sans)" },
    { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
    { value: "Space Grotesk", label: "Space Grotesk (Tech)" },
    { value: "Montserrat", label: "Montserrat (Geo Sans)" },
    { value: "Roboto", label: "Roboto (Universal Sans)" },
    { value: "Instrument Serif", label: "Instrument Serif (Editorial)" },
    { value: "Darius (Bodoni)", label: "Darius (Bodoni Serif)" },
    { value: "Playfair Display", label: "Playfair Display (Serif)" },
    { value: "Cormorant Garamond", label: "Cormorant Garamond (Serif)" },
    { value: "Newsreader", label: "Newsreader (Book Serif)" },
    { value: "Cinzel", label: "Cinzel (Classic Display)" },
    { value: "Caveat (Handwriting)", label: "Caveat (Handwriting)" },
    {
        value: "Dancing Script (Handwriting)",
        label: "Dancing Script (Handwriting)",
    },
    { value: "Pacifico (Handwriting)", label: "Pacifico (Handwriting)" },
    { value: "Fira Code (Monospace)", label: "Fira Code (Monospace)" },
    { value: "System Default", label: "System Default" },
];

const FONT_PRESETS = [
    {
        name: "Editorial Elegant (Default)",
        primary: "Outfit",
        secondary: "Lora",
    },
    {
        name: "Modern Minimalist",
        primary: "Inter",
        secondary: "Plus Jakarta Sans",
    },
    {
        name: "Editorial Bodoni",
        primary: "Newsreader",
        secondary: "Darius (Bodoni)",
    },
    {
        name: "Cyberpunk Monospace",
        primary: "Space Grotesk",
        secondary: "Fira Code (Monospace)",
    },
    { name: "Classic Roman", primary: "Montserrat", secondary: "Cinzel" },
    {
        name: "Friendly Handwriting",
        primary: "Lexend",
        secondary: "Caveat (Handwriting)",
    },
];

export default function WorkspaceShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const {
        users,
        currentUser,
        isClient,
        isInitialized,
        teams,
        currentTeam,
        setCurrentTeam,
        teamMembers,
        userRole,
        tasks,
        columns,
        notifications,
        isNotificationsLoading,
        activeDateStr,
        setActiveDateStr,
        currentView,
        selectedTaskId,
        setSelectedTaskId,
        selectedMemberFilter,
        setSelectedMemberFilter,
        searchQuery,
        setSearchQuery,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isConfigModalOpen,
        setIsConfigModalOpen,
        isAddTaskOpen,
        setIsAddTaskOpen,
        addTaskColId,
        setAddTaskColId,
        isCreateTeamModalOpen,
        setIsCreateTeamModalOpen,
        profileModalUser,
        setProfileModalUser,
        loadTasks,
        loadTeamMetadata,
        handleUpdateTaskColumn,
        handleToggleComplete,
        handleAddQuickTask,
        handleCreateTeam,
        handleUpdateTeam,
        handleDeleteTeam,
        handleLeaveTeam,
        handleLogout,
        handleMarkNotificationRead,
        handleClearAllNotifications,
        handleArchiveNotification,
        handleLoginSuccess,
    } = useWorkspace();

    const pathname = usePathname();

    // Column configure modal local state
    const [editingColumns, setEditingColumns] = useState<any[]>(columns);
    const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);

    // Sync editingColumns when columns change
    React.useEffect(() => {
        setEditingColumns(columns);
    }, [columns]);

    // Task creation local state
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPriority, setNewPriority] = useState("MEDIUM");
    const [newAssigneeId, setNewAssigneeId] = useState("");
    const [newDueDate, setNewDueDate] = useState("");
    const [newEstTime, setNewEstTime] = useState("");
    const [newIsRecurring, setNewIsRecurring] = useState(false);
    const [newRecurrence, setNewRecurrence] = useState("DAILY");

    // Loading states for async operations
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isSavingColumns, setIsSavingColumns] = useState(false);

    // Pre-populate and synchronize newDueDate with activeDateStr when modal is opened/closed

    React.useEffect(() => {
        if (isAddTaskOpen) {
            if (activeDateStr) {
                setNewDueDate(activeDateStr);
            }
            if (userRole === "MEMBER" && currentUser) {
                setNewAssigneeId(currentUser.id);
            }
        } else {
            // Reset state on close
            setNewTitle("");
            setNewDesc("");
            setNewPriority("MEDIUM");
            setNewAssigneeId("");
            setNewDueDate("");
            setNewEstTime("");
            setNewIsRecurring(false);
            setNewRecurrence("DAILY");
        }
    }, [isAddTaskOpen]);
    const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<"theme" | "typography">(
        "theme",
    );
    const [primaryFont, setPrimaryFont] = useState("Outfit");
    const [secondaryFont, setSecondaryFont] = useState("Lora");
    const [fontScale, setFontScale] = useState(1.25);

    const scaleOptions = [
        { value: "0.85", label: "85% (Very Small)" },
        { value: "1.00", label: "100% (Normal)" },
        { value: "1.15", label: "115% (Large)" },
        { value: "1.25", label: "125% (Extra Large - Default)" },
        { value: "1.40", label: "140% (Double XL)" },
        { value: "1.50", label: "150% (Huge)" },
    ];

    const closestScaleOption = scaleOptions.reduce((prev, curr) => {
        return Math.abs(parseFloat(curr.value) - fontScale) <
            Math.abs(parseFloat(prev.value) - fontScale)
            ? curr
            : prev;
    }, scaleOptions[3]);

    // Reset settings handler
    const handleResetSettings = () => {
        setPrimaryFont("Outfit");
        setSecondaryFont("Lora");
        setFontScale(1.25);
        localStorage.setItem("sys_primary_font", "Outfit");
        localStorage.setItem("sys_secondary_font", "Lora");
        localStorage.setItem("sys_font_scale", "1.25");
        const root = document.documentElement;
        root.style.zoom = "100%";
        root.style.setProperty("--font-scale", "1.25");
        toast.success("Settings reset to Outfit & Lora");
    };

    // Load saved preferences from localStorage on initial render
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const savedPrimary = localStorage.getItem("sys_primary_font");
        const savedSecondary = localStorage.getItem("sys_secondary_font");
        const savedScale = localStorage.getItem("sys_font_scale");
        if (savedPrimary) setPrimaryFont(savedPrimary);
        if (savedSecondary) setSecondaryFont(savedSecondary);
        if (savedScale) {
            setFontScale(parseFloat(savedScale));
        } else {
            setFontScale(1.25);
        }
    }, []);

    const [theme, setTheme] = useState<
        "light" | "nord-dark" | "amoled-dark" | "lws-dark"
    >("light");

    // Load saved theme preference on mount
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const savedTheme = localStorage.getItem("sys_theme") as any;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        }
    }, []);

    const handleToggleTheme = () => {
        const nextTheme = theme === "light" ? "lws-dark" : "light";
        setTheme(nextTheme);
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("sys_theme", nextTheme);
        toast.success(
            `Switched to ${nextTheme === "lws-dark" ? "LWS Dark Mode" : "Light Mode"}`,
        );
    };

    // Keyboard shortcuts: Ctrl + (increase font scale) / Ctrl - (decrease font scale)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "=" || e.key === "+") {
                    e.preventDefault();
                    setFontScale((prev) => {
                        const next = Math.min(1.5, prev + 0.05);
                        return Math.round(next * 100) / 100;
                    });
                    toast.success("Font scale increased", {
                        id: "font-scale-toast",
                    });
                } else if (e.key === "-") {
                    e.preventDefault();
                    setFontScale((prev) => {
                        const next = Math.max(0.85, prev - 0.05);
                        return Math.round(next * 100) / 100;
                    });
                    toast.success("Font scale decreased", {
                        id: "font-scale-toast",
                    });
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // Apply font family dynamically to root element and persist in localStorage
    React.useEffect(() => {
        const root = document.documentElement;

        if (fontMap[primaryFont]) {
            root.style.setProperty("--font-primary", fontMap[primaryFont]);
            root.style.setProperty("--font-sans", fontMap[primaryFont]);
            document.body.style.setProperty(
                "font-family",
                fontMap[primaryFont],
                "important",
            );
            localStorage.setItem("sys_primary_font", primaryFont);
        }

        if (fontMap[secondaryFont]) {
            root.style.setProperty("--font-secondary", fontMap[secondaryFont]);
            root.style.setProperty("--font-serif", fontMap[secondaryFont]);
            root.style.setProperty(
                "--font-instrument-serif",
                fontMap[secondaryFont],
            );
            localStorage.setItem("sys_secondary_font", secondaryFont);
        }

        // Apply dynamic font scale
        root.style.setProperty("--font-scale", fontScale.toString());
        localStorage.setItem("sys_font_scale", fontScale.toString());
        root.style.zoom = "100%";
    }, [primaryFont, secondaryFont, fontScale]);

    if (!isClient || !isInitialized) return null;

    const isLoginPage = pathname === "/login";
    if (isLoginPage) {
        return <>{children}</>;
    }

    if (!currentUser) {
        return null;
    }

    if (teams.length === 0) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAF9] text-[#1A1A1A] p-6">
                <div className="corner-brackets w-full max-w-md bg-white border border-[#E5E5E3] p-6 flex flex-col gap-5 text-center">
                    <div>
                        <h1 className="font-heading text-2xl text-[#1A1A1A]">
                            Welcome to OfficeTask
                        </h1>
                        <p className="eyebrow mt-1">
                            Initialize your first workspace
                        </p>
                    </div>

                    <div className="border border-[#E5E5E3] p-4 flex flex-col gap-2.5 text-left">
                        <h3 className="text-base font-semibold text-[#1A1A1A]">
                            Create a New Workspace
                        </h3>
                        <p className="text-base text-[#888883] leading-relaxed">
                            Standard Kanban boards will be provisioned
                            automatically. You will be designated as Workspace
                            Leader.
                        </p>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const tName = formData.get(
                                    "teamName",
                                ) as string;
                                if (tName && tName.trim()) {
                                    setIsProvisioning(true);
                                    try {
                                        await handleCreateTeam(tName.trim());
                                    } finally {
                                        setIsProvisioning(false);
                                    }
                                }
                            }}
                            className="flex gap-2 mt-1"
                        >
                            <input
                                type="text"
                                name="teamName"
                                placeholder="Workspace Name (e.g. Core Engineering)"
                                className={inputClass}
                                required
                                disabled={isProvisioning}
                            />
                            <button
                                type="submit"
                                disabled={isProvisioning}
                                className="px-3 py-1.5 bg-[#1A1A1A] text-white text-[11px] font-medium rounded-[3px] shrink-0 hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                            >
                                {isProvisioning && (
                                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                )}
                                <span>
                                    {isProvisioning
                                        ? "Provisioning…"
                                        : "Provision"}
                                </span>
                            </button>
                        </form>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-base text-[#CB2431] hover:underline font-medium mt-1"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        );
    }

    const activeTask = tasks.find((t) => t.id === selectedTaskId);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentTeam || !newTitle.trim()) return;

        if (newTitle.trim().length > APP_CONFIG.MAX_TASK_TITLE_LENGTH) {
            toast.error(
                `Task title must not exceed ${APP_CONFIG.MAX_TASK_TITLE_LENGTH} characters.`,
            );
            return;
        }

        setIsCreatingTask(true);
        try {
            await api.createTask({
                title: newTitle.trim(),
                description: newDesc.trim() || undefined,
                priority: newPriority,
                columnId: addTaskColId || columns[0]?.id,
                teamId: currentTeam.id,
                createdById: currentUser.id,
                assignedToId: newAssigneeId || undefined,
                dueDate: newDueDate || undefined,
                estimatedTime:
                    newEstTime !== ""
                        ? Math.max(0, Number(newEstTime))
                        : undefined,
                isRecurring: newIsRecurring,
                recurrence: newIsRecurring ? newRecurrence : undefined,
            });

            toast.success("Task created successfully");
            setIsAddTaskOpen(false);
            setNewTitle("");
            setNewDesc("");
            setNewAssigneeId("");
            setNewDueDate("");
            setNewEstTime("");
            setNewIsRecurring(false);
            loadTasks();
        } catch (err: any) {
            toast.error(err.message || "Failed to create task");
        } finally {
            setIsCreatingTask(false);
        }
    };

    const handleColDragStart = (e: React.DragEvent, index: number) => {
        setDraggedColIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleColDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleColDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedColIndex === null || draggedColIndex === dropIndex) return;
        if (draggedColIndex === 0 || dropIndex === 0) {
            toast.error("The primary starting column cannot be reordered.");
            return;
        }

        const updated = [...editingColumns];
        const [movedCol] = updated.splice(draggedColIndex, 1);
        updated.splice(dropIndex, 0, movedCol);

        setEditingColumns(updated);
        setDraggedColIndex(null);
    };

    const handleMoveColumn = (index: number, direction: "up" | "down") => {
        if (index === 0) return;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex <= 0 || targetIndex >= editingColumns.length) return;

        const updated = [...editingColumns];
        const [movedCol] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, movedCol);

        setEditingColumns(updated);
    };

    const handleSaveColumns = async () => {
        if (!currentTeam) return;
        setIsSavingColumns(true);
        try {
            const reorderedCols = editingColumns.map((col, idx) => ({
                ...col,
                order: idx + 1,
                isComplete: idx === editingColumns.length - 1,
            }));

            await api.updateColumns(currentTeam.id, reorderedCols);
            toast.success("Board columns updated successfully");
            setIsConfigModalOpen(false);
            loadTeamMetadata();
            loadTasks();
        } catch (err: any) {
            toast.error(err.message || "Failed to update columns");
        } finally {
            setIsSavingColumns(false);
        }
    };

    const viewLabel = (() => {
        if (pathname === "/profile") return "Profile Settings";
        if (pathname === "/bookmarks") return "Bookmarks";
        if (pathname === "/knowledge") return "Docs & Knowledge Base";
        if (pathname === "/reports") return "Reports";
        if (pathname === "/calendar") return "Calendar";
        if (pathname === "/list") return "List View";
        if (pathname === "/dashboard") return "Leader Dashboard";
        if (pathname === "/myday" || currentView === "myday") return "My Day";
        if (pathname === "/map" || currentView === "map")
            return "Workspace Solar Map";
        if (currentView === "kanban" || pathname === "/task-board")
            return "Kanban Board";
        return currentView.charAt(0).toUpperCase() + currentView.slice(1);
    })();

    return (
        <div className="flex h-screen bg-[#FAFAF9] font-sans text-[#1A1A1A] overflow-hidden">
            {/* Sidebar navigation — Persistent at Layout level */}
            <Sidebar
                currentUser={currentUser}
                onLogout={handleLogout}
                teams={teams}
                currentTeam={currentTeam}
                setCurrentTeam={setCurrentTeam}
                onCreateTeamClick={() => setIsCreateTeamModalOpen(true)}
                currentView={currentView}
                toggleConfigModal={() => setIsConfigModalOpen(true)}
                userRole={userRole}
                theme={theme}
                onToggleTheme={handleToggleTheme}
            />

            {/* Main Workspace Frame */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Global Header Toolbar */}
                <header className="h-12 border-b border-[#E5E5E3] px-5 flex items-center justify-between shrink-0 select-none print:hidden bg-white">
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-medium text-[#888883] border border-[#E5E5E3] px-2.5 py-1 rounded-[3px]">
                            {viewLabel}
                        </span>

                        {(currentView === "kanban" ||
                            currentView === "dashboard" ||
                            currentView === "map") && (
                            <div className="flex items-center gap-2 text-[11px]">
                                <span className="text-[#888883]">Date:</span>
                                <CustomDatePicker
                                    value={activeDateStr}
                                    onChange={(val) => setActiveDateStr(val)}
                                    className="w-36"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={handleToggleTheme}
                            className="relative corner-brackets-4 p-2 border border-[#E5E5E3] rounded-[2px] bg-white hover:bg-[#FAFAF9] text-[#1A1A1A] transition-colors flex items-center justify-center cursor-pointer"
                            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
                        >
                            {theme !== "light" ? (
                                <Sun className="w-4 h-4 shrink-0 text-[#EBCB8B]" />
                            ) : (
                                <Moon className="w-4 h-4 shrink-0 text-[#1A1A1A]" />
                            )}
                        </button>

                        <button
                            onClick={() => setIsNotificationsOpen((p) => !p)}
                            className="relative corner-brackets-4 p-2 border border-[#E5E5E3] rounded-[2px] bg-white hover:bg-[#FAFAF9] text-[#1A1A1A] transition-colors flex items-center justify-center cursor-pointer"
                            title="Notifications"
                        >
                            <Bell className="w-4 h-4 shrink-0" />
                            {notifications.filter(
                                (n) => !n.isRead && !n.isArchived,
                            ).length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#CB2431] text-white rounded-full w-4 h-4 text-[9px] font-medium flex items-center justify-center scale-90">
                                    {
                                        notifications.filter(
                                            (n) => !n.isRead && !n.isArchived,
                                        ).length
                                    }
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setIsSystemSettingsOpen(true)}
                            className="relative corner-brackets-4 p-2 border border-[#E5E5E3] rounded-[2px] bg-white hover:bg-[#FAFAF9] text-[#1A1A1A] transition-colors flex items-center justify-center cursor-pointer"
                            title="System Appearance & Preferences"
                        >
                            <Settings className="w-4 h-4 shrink-0 text-[#1A1A1A]" />
                        </button>

                        {userRole !== "OBSERVER" && pathname !== "/profile" && (
                            <button
                                onClick={() => {
                                    setAddTaskColId(columns[0]?.id || "");
                                    setIsAddTaskOpen(true);
                                }}
                                className="relative corner-brackets-4 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] text-[11px] font-medium px-4 py-1.5 rounded-[2px] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />
                                <span>+ New Task</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* Page Content Slot */}
                <div className="flex-1 flex flex-col overflow-hidden relative border border-[#E5E5E3] bg-white corner-brackets">
                    {children}
                </div>
            </main>

            {/* Slide & Overlay Modals */}
            <NotificationsTray
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                isLoading={isNotificationsLoading}
                onMarkRead={handleMarkNotificationRead}
                onClearAll={handleClearAllNotifications}
                onArchiveNotification={handleArchiveNotification}
                onSelectTask={(id: string) => {
                    setSelectedTaskId(id);
                    setIsNotificationsOpen(false);
                }}
            />

            {selectedTaskId && activeTask && (
                <TaskModal
                    task={activeTask}
                    isOpen={!!selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                    columns={columns}
                    teamMembers={teamMembers}
                    currentUser={currentUser}
                    userRole={userRole}
                    onRefresh={() => {
                        loadTasks();
                        loadTeamMetadata();
                    }}
                />
            )}

            {/* LinkedIn-Style Member Profile Popup */}
            {profileModalUser && (
                <MemberProfileModal
                    user={profileModalUser}
                    userRole={
                        teamMembers.find(
                            (tm) => tm.user.id === profileModalUser.id,
                        )?.role || "MEMBER"
                    }
                    isOpen={!!profileModalUser}
                    onClose={() => setProfileModalUser(null)}
                    tasks={tasks}
                    onSelectTask={(id) => setSelectedTaskId(id)}
                />
            )}

            {/* Create Task Modal */}
            {isAddTaskOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsAddTaskOpen(false)}
                    />
                    <div
                        className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-xl flex flex-col gap-3.5 animate-fade-in text-left rounded-[3px] corner-brackets max-h-[90vh] overflow-y-auto scrollbar-none"
                        style={{ boxShadow: "var(--shadow-float)" }}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
                            <h2 className="font-heading text-base text-[#1A1A1A]">
                                Create New Task
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsAddTaskOpen(false)}
                                className="text-[#888883] hover:text-[#1A1A1A] text-[14px] font-bold px-1 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateTask}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Title *</label>
                                <input
                                    type="text"
                                    placeholder="Task title…"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                    maxLength={APP_CONFIG.MAX_TASK_TITLE_LENGTH}
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Description</label>
                                <TipTapEditor
                                    value={newDesc}
                                    onChange={(html) => setNewDesc(html)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="eyebrow">Assignee</label>
                                    <CustomSelect
                                        options={
                                            userRole === "MEMBER" && currentUser
                                                ? [
                                                      {
                                                          value: currentUser.id,
                                                          label: `${currentUser.name} (You)`,
                                                          avatarUrl:
                                                              currentUser.avatarUrl ||
                                                              null,
                                                      },
                                                  ]
                                                : [
                                                      {
                                                          value: "",
                                                          label: "Unassigned",
                                                      },
                                                      ...teamMembers.map(
                                                          ({ user }) => ({
                                                              value: user.id,
                                                              label:
                                                                  user.id ===
                                                                  currentUser.id
                                                                      ? `${user.name} (You)`
                                                                      : user.name,
                                                              avatarUrl:
                                                                  user.avatarUrl ||
                                                                  null,
                                                          }),
                                                      ),
                                                  ]
                                        }
                                        value={newAssigneeId}
                                        onChange={(val) =>
                                            setNewAssigneeId(val)
                                        }
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="eyebrow">Priority</label>
                                    <CustomSelect
                                        options={[
                                            { value: "LOW", label: "Low" },
                                            {
                                                value: "MEDIUM",
                                                label: "Medium",
                                            },
                                            { value: "HIGH", label: "High" },
                                            {
                                                value: "URGENT",
                                                label: "Urgent",
                                            },
                                        ]}
                                        value={newPriority}
                                        onChange={(val) => setNewPriority(val)}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="eyebrow">Due Date</label>
                                    <CustomDatePicker
                                        value={newDueDate}
                                        onChange={(val) => setNewDueDate(val)}
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="eyebrow">
                                        Est. Hours
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        placeholder="0"
                                        value={newEstTime}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (
                                                val === "" ||
                                                (Number(val) >= 0 &&
                                                    !val.includes("-"))
                                            ) {
                                                setNewEstTime(val);
                                            }
                                        }}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    checked={newIsRecurring}
                                    onChange={(e) =>
                                        setNewIsRecurring(e.target.checked)
                                    }
                                    className="rounded-[2px] border-[#DADAD6] text-[#1A1A1A] bg-white focus:ring-0 cursor-pointer"
                                />
                                <label
                                    htmlFor="isRecurring"
                                    className="text-[11px] text-[#1A1A1A] cursor-pointer"
                                >
                                    Recurring Task
                                </label>
                            </div>

                            {newIsRecurring && (
                                <div className="flex flex-col gap-1 animate-fade-in">
                                    <label className="eyebrow">Interval</label>
                                    <CustomSelect
                                        options={[
                                            { value: "DAILY", label: "Daily" },
                                            {
                                                value: "WEEKLY",
                                                label: "Weekly",
                                            },
                                            {
                                                value: "MONTHLY",
                                                label: "Monthly",
                                            },
                                        ]}
                                        value={newRecurrence}
                                        onChange={(val) =>
                                            setNewRecurrence(val)
                                        }
                                        className="w-full"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
                                <button
                                    type="button"
                                    onClick={() => setIsAddTaskOpen(false)}
                                    disabled={isCreatingTask}
                                    className="relative corner-brackets-4 px-3.5 py-1.5 border border-[#E5E5E3] bg-white hover:bg-[#FAFAF9] text-[11px] font-medium text-[#888883] rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingTask}
                                    className="relative corner-brackets-4 px-4 py-1.5 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreatingTask ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                    ) : (
                                        <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />
                                    )}
                                    <span>
                                        {isCreatingTask
                                            ? "Creating Task…"
                                            : "Create Task"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Columns Configuration Modal */}
            {isConfigModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsConfigModalOpen(false)}
                    />
                    <div
                        className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-2xl flex flex-col gap-3.5 animate-fade-in text-left max-h-[85vh]"
                        style={{ boxShadow: "var(--shadow-float)" }}
                    >
                        <h2 className="font-heading text-lg">
                            Configure Columns
                        </h2>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-1 pr-1">
                            <div className="text-xs text-[#888883] leading-relaxed mb-1 flex flex-col gap-0.5">
                                <p>
                                    Customize board columns and configure carry
                                    forward rules.
                                </p>
                                <p className="text-[10px] text-[#888883]">
                                    <span className="font-medium text-[#1A1A1A]">
                                        ▪ Carry Forward:
                                    </span>{" "}
                                    Automatically moves incomplete tasks in
                                    checked columns to the next day.
                                </p>
                            </div>

                            {editingColumns.map((col, index) => {
                                const isColConstant = [
                                    "to do",
                                    "todo",
                                    "in progress",
                                    "need attention later",
                                    "need attention",
                                    "done",
                                ].includes(col.name.toLowerCase().trim());
                                return (
                                    <div
                                        key={col.id || index}
                                        draggable={index !== 0}
                                        onDragStart={(e) =>
                                            index !== 0 &&
                                            handleColDragStart(e, index)
                                        }
                                        onDragOver={(e) =>
                                            index !== 0 &&
                                            handleColDragOver(e, index)
                                        }
                                        onDrop={(e) =>
                                            index !== 0 &&
                                            handleColDrop(e, index)
                                        }
                                        className={`border border-[#E5E5E3] p-3 flex flex-col sm:flex-row gap-2.5 items-start sm:items-center bg-white transition-all ${
                                            draggedColIndex === index
                                                ? "opacity-40 border-dashed border-[#1A1A1A]"
                                                : "hover:border-[#DADAD6]"
                                        }`}
                                    >
                                        <div className="flex-1 flex gap-2 items-center w-full">
                                            <div className="flex items-center gap-1 shrink-0 text-[#888883]">
                                                {index === 0 ? (
                                                    <>
                                                        <span
                                                            title="Primary starting column"
                                                            className="opacity-20 select-none text-[12px] px-1 font-bold text-[#888883] cursor-not-allowed"
                                                        >
                                                            ⠿
                                                        </span>
                                                        <div className="flex flex-col text-[9px] leading-none opacity-20 cursor-not-allowed">
                                                            <span className="px-0.5 select-none">
                                                                ▲
                                                            </span>
                                                            <span className="px-0.5 select-none">
                                                                ▼
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span
                                                            title="Drag to reorder"
                                                            className="cursor-grab active:cursor-grabbing text-[12px] px-1 hover:text-[#1A1A1A] select-none font-bold"
                                                        >
                                                            ⠿
                                                        </span>
                                                        <div className="flex flex-col text-[9px] leading-none">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    index <= 1
                                                                }
                                                                onClick={() =>
                                                                    handleMoveColumn(
                                                                        index,
                                                                        "up",
                                                                    )
                                                                }
                                                                className="hover:text-[#1A1A1A] disabled:opacity-20 px-0.5"
                                                                title="Move up"
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    index ===
                                                                        0 ||
                                                                    index ===
                                                                        editingColumns.length -
                                                                            1
                                                                }
                                                                onClick={() =>
                                                                    handleMoveColumn(
                                                                        index,
                                                                        "down",
                                                                    )
                                                                }
                                                                className="hover:text-[#1A1A1A] disabled:opacity-20 px-0.5"
                                                                title="Move down"
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={col.name}
                                                disabled={isColConstant}
                                                readOnly={isColConstant}
                                                title={
                                                    isColConstant
                                                        ? "Constant column name cannot be edited."
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    if (isColConstant) return;
                                                    const updated = [
                                                        ...editingColumns,
                                                    ];
                                                    updated[index].name =
                                                        e.target.value;
                                                    setEditingColumns(updated);
                                                }}
                                                className={inputClass}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-3 items-center shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                                            <label
                                                className="flex items-center gap-1.5 text-[11px] text-[#888883] cursor-pointer"
                                                title="Automatically carry forward incomplete tasks to the next day"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        col.triggersCarryForward !==
                                                        false
                                                    }
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...editingColumns,
                                                        ];
                                                        updated[
                                                            index
                                                        ].triggersCarryForward =
                                                            e.target.checked;
                                                        setEditingColumns(
                                                            updated,
                                                        );
                                                    }}
                                                    className="rounded-[2px]"
                                                />
                                                Carry Forward
                                            </label>

                                            {isColConstant ? (
                                                <span className="text-[11px] text-transparent select-none">
                                                    Delete
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingColumns(
                                                            (prev) =>
                                                                prev.filter(
                                                                    (_, idx) =>
                                                                        idx !==
                                                                        index,
                                                                ),
                                                        );
                                                    }}
                                                    className="text-[11px] text-[#CB2431] hover:underline cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingColumns((prev) => [
                                        ...prev,
                                        {
                                            name: "New Column",
                                            order: prev.length + 1,
                                            wipLimit: null,
                                            isComplete: false,
                                            triggersCarryForward: true,
                                        },
                                    ]);
                                }}
                                className="relative corner-brackets-4 py-2 border border-dashed border-[#E5E5E3] hover:border-[#1A1A1A] text-[11px] text-[#888883] hover:text-[#1A1A1A] font-medium rounded-[3px] transition-colors mt-1 cursor-pointer"
                            >
                                + Add Column
                            </button>
                        </div>

                        <div className="flex justify-end gap-2 shrink-0 pt-2 border-t border-[#E5E5E3]">
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={isSavingColumns}
                                onClick={() => setIsConfigModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveColumns}
                                isLoading={isSavingColumns}
                                loadingText="Saving Changes…"
                                showDot
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* System Appearance & Preferences Popup Modal */}
            {isSystemSettingsOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-center items-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsSystemSettingsOpen(false)}
                    />
                    <div
                        className="relative bg-white border border-[#E5E5E3] p-5 w-full max-w-md flex flex-col gap-4 animate-fade-in text-left rounded-[3px] corner-brackets shadow-xl"
                        style={{ boxShadow: "var(--shadow-float)" }}
                    >
                        <div className="flex items-center justify-between pb-1">
                            <div>
                                <span className="eyebrow capitalize text-[10px]">
                                    Preferences
                                </span>
                                <h2 className="font-heading text-base text-[#1A1A1A]">
                                    System Preferences
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSystemSettingsOpen(false)}
                                className="text-[#888883] hover:text-[#1A1A1A] text-[14px] font-bold px-1 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Navigation Tabs Bar */}
                        <div className="bg-[#FAFAF9] px-2 py-1.5 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setSettingsTab("theme")}
                                className={`relative px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    settingsTab === "theme"
                                        ? "bg-white text-[#1A1A1A] border border-[#E5E5E3] corner-brackets-4"
                                        : "text-[#888883] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]"
                                }`}
                            >
                                <Palette className="w-3 h-3 shrink-0" />
                                <span>Theme & Color</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettingsTab("typography")}
                                className={`relative px-3 py-1.5 text-[11px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                                    settingsTab === "typography"
                                        ? "bg-white text-[#1A1A1A] border border-[#E5E5E3] corner-brackets-4"
                                        : "text-[#888883] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]"
                                }`}
                            >
                                <Type className="w-3 h-3 shrink-0" />
                                <span>Typography & Fonts</span>
                            </button>
                        </div>

                        {/* Section Divider 1 */}
                        <div className="relative w-full border-t border-[#E5E5E3]">
                            {/* Left T-Bracket ├ */}
                            <div className="absolute -left-[5px] -top-[5px] w-[10px] h-[10px] pointer-events-none z-20 flex items-center justify-center text-[#1A1A1A]">
                                <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 10 10"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M5 0V10M5 5H10"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 max-h-[55vh] overflow-y-auto pr-0.5">
                            {settingsTab === "theme" ? (
                                <div className="flex flex-col gap-3.5">
                                    {/* Color Theme Selector */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="eyebrow">
                                            Select Workspace Color Palette
                                        </label>
                                        <CustomSelect
                                            options={[
                                                {
                                                    value: "light",
                                                    label: "Editorial Light (Default)",
                                                },
                                                {
                                                    value: "nord-dark",
                                                    label: "Nord Dark Mode",
                                                },
                                                {
                                                    value: "amoled-dark",
                                                    label: "AMOLED Pitch Black",
                                                },
                                                {
                                                    value: "lws-dark",
                                                    label: "Learn With Sumit (LWS) Dark",
                                                },
                                            ]}
                                            value={theme}
                                            onChange={(val) => {
                                                setTheme(val as any);
                                                document.documentElement.setAttribute(
                                                    "data-theme",
                                                    val,
                                                );
                                                localStorage.setItem(
                                                    "sys_theme",
                                                    val,
                                                );
                                                toast.success(`Theme updated`);
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                    <p className="text-[11px] text-[#888883] leading-relaxed">
                                        Choose a visual theme for your task
                                        workspace. Changes apply instantly
                                        across the sidebars, tables, and
                                        dialogs.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {/* 2x2 Grid with Primary Font, Secondary Font, and Presets spanning 2 cols */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Row 1, Col 1: Primary Interface Font */}
                                        <div className="flex flex-col gap-1">
                                            <label className="eyebrow">
                                                Primary Interface Font
                                            </label>
                                            <CustomSelect
                                                options={FONT_OPTIONS}
                                                value={primaryFont}
                                                onChange={(val) =>
                                                    setPrimaryFont(val)
                                                }
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Row 1, Col 2: Secondary / Title Font */}
                                        <div className="flex flex-col gap-1">
                                            <label className="eyebrow">
                                                Secondary / Title Font
                                            </label>
                                            <CustomSelect
                                                options={FONT_OPTIONS}
                                                value={secondaryFont}
                                                onChange={(val) =>
                                                    setSecondaryFont(val)
                                                }
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Row 2, Col 1: Preset Combinations Dropdown */}
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <label className="eyebrow">
                                                    Preset Pairings
                                                </label>
                                                <span className="text-[10px] text-[#888883]">
                                                    1-Click Apply
                                                </span>
                                            </div>
                                            <CustomSelect
                                                options={FONT_PRESETS.map(
                                                    (p) => ({
                                                        value: `${p.primary}|${p.secondary}`,
                                                        label: p.name,
                                                        sublabel: `${p.primary} + ${p.secondary}`,
                                                    }),
                                                )}
                                                value={
                                                    FONT_PRESETS.some(
                                                        (p) =>
                                                            p.primary ===
                                                                primaryFont &&
                                                            p.secondary ===
                                                                secondaryFont,
                                                    )
                                                        ? `${primaryFont}|${secondaryFont}`
                                                        : ""
                                                }
                                                placeholder="Select a preset combination…"
                                                onChange={(val) => {
                                                    const [prim, sec] =
                                                        val.split("|");
                                                    if (prim && sec) {
                                                        setPrimaryFont(prim);
                                                        setSecondaryFont(sec);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Row 2, Col 2: Font Scale Option Dropdown */}
                                        <div className="flex flex-col gap-1">
                                            <label className="eyebrow">
                                                Font Scale Preset
                                            </label>
                                            <CustomSelect
                                                options={scaleOptions}
                                                value={closestScaleOption.value}
                                                onChange={(val) =>
                                                    setFontScale(
                                                        parseFloat(val),
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* System Font Scale Slider */}
                                    <div className="flex flex-col gap-1.5 border-t border-[#E5E5E3]/60 pt-3">
                                        <div className="flex justify-between items-center">
                                            <label className="eyebrow">
                                                System Font Scale
                                            </label>
                                            <span className="text-[11px] text-[#1A1A1A] font-semibold">
                                                {Math.round(fontScale * 100)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-[#888883] font-medium">
                                                A
                                            </span>
                                            <input
                                                type="range"
                                                min="0.85"
                                                max="1.50"
                                                step="0.05"
                                                value={fontScale}
                                                onChange={(e) =>
                                                    setFontScale(
                                                        parseFloat(
                                                            e.target.value,
                                                        ),
                                                    )
                                                }
                                                className="flex-1 h-1 bg-[#E5E5E3] rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="text-sm font-semibold text-[#1A1A1A]">
                                                A
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sample Preview Box (Visible on both tabs for direct feedback) */}
                            <div className="p-3 border border-[#E5E5E3] bg-[#FAFAF9] rounded-[2px] flex flex-col gap-1 mt-0.5">
                                <span className="eyebrow text-[9px]">
                                    Live Typography Preview
                                </span>
                                <h4
                                    style={{
                                        fontFamily:
                                            fontMap[secondaryFont] || "inherit",
                                    }}
                                    className="text-base font-semibold text-[#1A1A1A] transition-all"
                                >
                                    Workspace & Task Assignment System
                                </h4>
                                <p
                                    style={{
                                        fontFamily:
                                            fontMap[primaryFont] || "inherit",
                                    }}
                                    className="text-xs text-[#888883] transition-all"
                                >
                                    Configure your team workspace appearance.
                                    Settings automatically scale typography and
                                    UI components in real time.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 border-t border-[#E5E5E3]">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleResetSettings}
                                icon={<RotateCcw className="w-3.5 h-3.5" />}
                            >
                                Reset Settings
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setIsSystemSettingsOpen(false)}
                                showDot
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Workspaces & Teams Modal */}
            <ManageTeamsModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                teams={teams}
                currentTeam={currentTeam}
                currentUser={currentUser}
                userRole={userRole}
                onSelectTeam={(team) => setCurrentTeam(team)}
                onCreateTeam={handleCreateTeam}
                onUpdateTeam={handleUpdateTeam}
                onDeleteTeam={handleDeleteTeam}
                onLeaveTeam={handleLeaveTeam}
            />
        </div>
    );
}
