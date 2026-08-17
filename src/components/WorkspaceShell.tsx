"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import NotificationsTray from "./NotificationsTray";
import TaskModal from "./TaskModal";
import Login from "./Login";
import toast from "react-hot-toast";
import { CustomSelect } from "./ui/CustomSelect";
import { CustomDatePicker } from "./ui/CustomDatePicker";
import { TipTapEditor } from "./ui/TipTapEditor";
import { Button } from "./ui/Button";
import MemberProfileModal from "./MemberProfileModal";
import ManageTeamsModal from "./ManageTeamsModal";
import { useWorkspace } from "../context/WorkspaceContext";
import { api } from "../api";
import { Bell, Settings } from "lucide-react";

const inputClass =
    "px-2.5 py-1.5 border border-[#E5E5E3] focus:border-[#1A1A1A] focus:outline-none text-[11px] bg-white rounded-[3px] transition-colors w-full";

export default function WorkspaceShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const {
        users,
        currentUser,
        isClient,
        teams,
        currentTeam,
        setCurrentTeam,
        teamMembers,
        userRole,
        tasks,
        columns,
        notifications,
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
    const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
    const [primaryFont, setPrimaryFont] = useState("Lexend");
    const [secondaryFont, setSecondaryFont] = useState("Darius (Bodoni)");
    const [interfaceScale, setInterfaceScale] = useState("100%");

    // Load saved preferences from localStorage on initial render
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const savedPrimary = localStorage.getItem("sys_primary_font");
        const savedSecondary = localStorage.getItem("sys_secondary_font");
        const savedScale = localStorage.getItem("sys_interface_scale");
        if (savedPrimary) setPrimaryFont(savedPrimary);
        if (savedSecondary) setSecondaryFont(savedSecondary);
        if (savedScale) setInterfaceScale(savedScale);
    }, []);

    // Apply font family and scale dynamically to root element and persist in localStorage
    React.useEffect(() => {
        const root = document.documentElement;

        // Font mappings
        const fontMap: Record<string, string> = {
            "Lexend": "'Lexend', sans-serif",
            "Instrument Serif": "'Instrument Serif', serif",
            "Caveat (Handwriting)": "'Caveat', cursive",
            "Dancing Script (Handwriting)": "'Dancing Script', cursive",
            "Pacifico (Handwriting)": "'Pacifico', cursive",
            "Darius (Bodoni)": "'Bodoni Moda', serif",
            "Cormorant Garamond": "'Cormorant Garamond', serif",
            "Playfair Display": "'Playfair Display', serif",
            "Newsreader": "'Newsreader', serif",
            "Lora": "'Lora', serif",
            "Cinzel": "'Cinzel', serif",
            "Inter": "'Inter', sans-serif",
            "Outfit": "'Outfit', sans-serif",
            "Montserrat": "'Montserrat', sans-serif",
            "Space Grotesk": "'Space Grotesk', sans-serif",
            "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
            "Roboto": "'Roboto', sans-serif",
            "Fira Code (Monospace)": "'Fira Code', monospace",
            "System Default": "system-ui, -apple-system, sans-serif"
        };

        if (fontMap[primaryFont]) {
            root.style.setProperty("--font-primary", fontMap[primaryFont]);
            root.style.setProperty("--font-sans", fontMap[primaryFont]);
            document.body.style.setProperty("font-family", fontMap[primaryFont], "important");
            localStorage.setItem("sys_primary_font", primaryFont);
        }

        if (fontMap[secondaryFont]) {
            root.style.setProperty("--font-secondary", fontMap[secondaryFont]);
            root.style.setProperty("--font-serif", fontMap[secondaryFont]);
            root.style.setProperty("--font-instrument-serif", fontMap[secondaryFont]);
            localStorage.setItem("sys_secondary_font", secondaryFont);
        }

        // Scale mapping
        const scaleMap: Record<string, string> = {
            "85%": "85%",
            "90%": "90%",
            "95%": "95%",
            "100%": "100%",
            "105%": "105%",
            "110%": "110%",
            "115%": "115%"
        };
        root.style.zoom = scaleMap[interfaceScale] || "100%";
        localStorage.setItem("sys_interface_scale", interfaceScale);
    }, [primaryFont, secondaryFont, interfaceScale]);

    if (!isClient) return null;

    if (!currentUser) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
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
                        <h3 className="text-[12px] font-semibold text-[#1A1A1A]">
                            Create a New Workspace
                        </h3>
                        <p className="text-xs text-[#888883] leading-relaxed">
                            Standard Kanban boards will be provisioned
                            automatically. You will be designated as Workspace
                            Leader.
                        </p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const tName = formData.get(
                                    "teamName",
                                ) as string;
                                if (tName && tName.trim()) {
                                    handleCreateTeam(tName.trim());
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
                            />
                            <button
                                type="submit"
                                className="px-3 py-1.5 bg-[#1A1A1A] text-white text-[11px] font-medium rounded-[3px] shrink-0 hover:bg-[#333] transition-colors"
                            >
                                Provision
                            </button>
                        </form>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-xs text-[#CB2431] hover:underline font-medium mt-1"
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
                estimatedTime: newEstTime !== "" ? Math.max(0, Number(newEstTime)) : undefined,
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
        if (currentView === "kanban" || pathname === "/" || pathname === "/kanban") return "Kanban Board";
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
                theme="light"
                onToggleTheme={() => {}}
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
                            currentView === "dashboard") && (
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
                                        options={[
                                            { value: "", label: "Unassigned" },
                                            ...teamMembers.map(({ user }) => ({
                                                value: user.id,
                                                label: user.id === currentUser.id ? `${user.name} (You)` : user.name,
                                                avatarUrl: user.avatarUrl || null,
                                            })),
                                        ]}
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
                                    <label className="eyebrow">Est. Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        placeholder="0"
                                        value={newEstTime}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "" || (Number(val) >= 0 && !val.includes("-"))) {
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
                                        setNewIsRecurring(
                                            e.target.checked,
                                        )
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
                                    className="relative corner-brackets-4 px-3.5 py-1.5 border border-[#E5E5E3] bg-white hover:bg-[#FAFAF9] text-[11px] font-medium text-[#888883] rounded-[2px] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="relative corner-brackets-4 px-4 py-1.5 bg-white hover:bg-[#FAFAF9] border border-[#E5E5E3] text-[#1A1A1A] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <span className="w-1.5 h-1.5 bg-[#555555] rounded-[0.5px] inline-block" />
                                    <span>Create Task</span>
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
                        <h2 className="font-heading text-base">
                            Configure Columns
                        </h2>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-2 py-1 pr-1">
                            <div className="text-xs text-[#888883] leading-relaxed mb-1 flex flex-col gap-0.5">
                                <p>Customize board columns, set WIP limits, and configure carry forward rules.</p>
                                <p className="text-[11px] text-[#888883]">
                                    <span className="font-medium text-[#1A1A1A]">▪ Carry Forward:</span> Automatically moves incomplete tasks in checked columns to the next day.
                                </p>
                            </div>

                            {editingColumns.map((col, index) => (
                                <div
                                    key={col.id || index}
                                    draggable={index !== 0}
                                    onDragStart={(e) =>
                                        index !== 0 && handleColDragStart(e, index)
                                    }
                                    onDragOver={(e) =>
                                        index !== 0 && handleColDragOver(e, index)
                                    }
                                    onDrop={(e) => index !== 0 && handleColDrop(e, index)}
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
                                                        className="opacity-20 select-none text-[14px] px-1 font-bold text-[#888883] cursor-not-allowed"
                                                    >
                                                        ⠿
                                                    </span>
                                                    <div className="flex flex-col text-[9px] leading-none opacity-20 cursor-not-allowed">
                                                        <span className="px-0.5 select-none">▲</span>
                                                        <span className="px-0.5 select-none">▼</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span
                                                        title="Drag to reorder"
                                                        className="cursor-grab active:cursor-grabbing text-[14px] px-1 hover:text-[#1A1A1A] select-none font-bold"
                                                    >
                                                        ⠿
                                                    </span>
                                                    <div className="flex flex-col text-[9px] leading-none">
                                                        <button
                                                            type="button"
                                                            disabled={index <= 1}
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
                                                                index === 0 ||
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
                                            disabled={index === 0}
                                            readOnly={index === 0}
                                            title={index === 0 ? "Primary starting column cannot be edited." : ""}
                                            onChange={(e) => {
                                                if (index === 0) return;
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
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs text-[#888883]">
                                                WIP:
                                            </label>
                                            <input
                                                type="number"
                                                value={col.wipLimit || ""}
                                                placeholder="∞"
                                                onChange={(e) => {
                                                    const updated = [
                                                        ...editingColumns,
                                                    ];
                                                    updated[index].wipLimit = e
                                                        .target.value
                                                        ? parseInt(
                                                              e.target.value,
                                                          )
                                                        : null;
                                                    setEditingColumns(updated);
                                                }}
                                                className="w-12 px-1.5 py-1 border border-[#E5E5E3] text-[11px] rounded-[3px]"
                                            />
                                        </div>

                                        <label
                                            className="flex items-center gap-1.5 text-xs text-[#888883] cursor-pointer"
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
                                                    setEditingColumns(updated);
                                                }}
                                                className="rounded-[2px]"
                                            />
                                            Carry Forward
                                        </label>

                                        {index === 0 ? (
                                            <span className="text-xs text-transparent select-none">
                                                Delete
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingColumns((prev) =>
                                                        prev.filter(
                                                            (_, idx) =>
                                                                idx !== index,
                                                        ),
                                                    );
                                                }}
                                                className="text-xs text-[#CB2431] hover:underline cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

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

                        <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsConfigModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSaveColumns}
                                showDot
                            >
                                Save Columns
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
                        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
                            <div>
                                <span className="eyebrow uppercase tracking-[0.12em] text-[10px]">Preferences</span>
                                <h2 className="font-heading text-base text-[#1A1A1A]">
                                    System Appearance & Fonts
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

                        <div className="flex flex-col gap-3.5">
                            {/* Primary Font Selection */}
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Primary Interface Font</label>
                                <CustomSelect
                                    options={[
                                        { value: "Lexend", label: "Lexend (Modern Sans)" },
                                        { value: "Instrument Serif", label: "Instrument Serif" },
                                        { value: "Caveat (Handwriting)", label: "Caveat (Handwriting / Cursive)" },
                                        { value: "Dancing Script (Handwriting)", label: "Dancing Script (Calligraphy)" },
                                        { value: "Pacifico (Handwriting)", label: "Pacifico (Brush Script)" },
                                        { value: "Inter", label: "Inter (Clean Standard)" },
                                        { value: "Outfit", label: "Outfit (Geometric)" },
                                        { value: "Montserrat", label: "Montserrat (Modern Geo)" },
                                        { value: "Space Grotesk", label: "Space Grotesk (Tech)" },
                                        { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
                                        { value: "Roboto", label: "Roboto (Universal)" },
                                        { value: "Fira Code (Monospace)", label: "Fira Code (Monospace)" },
                                        { value: "System Default", label: "System Default UI" },
                                    ]}
                                    value={primaryFont}
                                    onChange={(val) => setPrimaryFont(val)}
                                    className="w-full"
                                />
                            </div>

                            {/* Secondary Font Selection */}
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Secondary / Title Font</label>
                                <CustomSelect
                                    options={[
                                        { value: "Instrument Serif", label: "Instrument Serif (Editorial)" },
                                        { value: "Darius (Bodoni)", label: "Darius (Bodoni Moda Serif)" },
                                        { value: "Playfair Display", label: "Playfair Display Serif" },
                                        { value: "Cormorant Garamond", label: "Cormorant Garamond Serif" },
                                        { value: "Newsreader", label: "Newsreader (Book Serif)" },
                                        { value: "Lora", label: "Lora (Contemporary Serif)" },
                                        { value: "Cinzel", label: "Cinzel (Classic Display)" },
                                        { value: "Caveat (Handwriting)", label: "Caveat (Handwriting)" },
                                        { value: "Dancing Script (Handwriting)", label: "Dancing Script (Handwriting)" },
                                        { value: "Pacifico (Handwriting)", label: "Pacifico (Brush)" },
                                        { value: "Lexend", label: "Lexend (Sans)" },
                                        { value: "Inter", label: "Inter (Sans)" },
                                    ]}
                                    value={secondaryFont}
                                    onChange={(val) => setSecondaryFont(val)}
                                    className="w-full"
                                />
                            </div>

                            {/* Interface Scale */}
                            <div className="flex flex-col gap-1">
                                <label className="eyebrow">Interface Scale</label>
                                <CustomSelect
                                    options={[
                                        { value: "85%", label: "85% (Compact)" },
                                        { value: "90%", label: "90% (Small)" },
                                        { value: "95%", label: "95% (Slightly Reduced)" },
                                        { value: "100%", label: "100% (Default Standard)" },
                                        { value: "105%", label: "105% (Slightly Larger)" },
                                        { value: "110%", label: "110% (Large)" },
                                        { value: "115%", label: "115% (Extra Large)" },
                                    ]}
                                    value={interfaceScale}
                                    onChange={(val) => setInterfaceScale(val)}
                                    className="w-full"
                                />
                            </div>

                            {/* Sample Preview Box */}
                            <div className="p-3 border border-[#E5E5E3] bg-[#FAFAF9] rounded-[2px] flex flex-col gap-1 mt-1">
                                <span className="eyebrow text-[9px]">Typography Sample</span>
                                <h4 style={{ fontFamily: secondaryFont === "Darius (Bodoni)" ? "'Bodoni Moda', serif" : secondaryFont === "Playfair Display" ? "'Playfair Display', serif" : "'Lexend', sans-serif" }} className="text-sm font-semibold text-[#1A1A1A]">
                                    Workspace & Task Assignment System
                                </h4>
                                <p style={{ fontFamily: primaryFont === "Lexend" ? "'Lexend', sans-serif" : primaryFont === "Outfit" ? "'Outfit', sans-serif" : "'Inter', sans-serif" }} className="text-[11px] text-[#888883]">
                                    Configure your team workspace appearance. Settings automatically save to local storage.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-[#E5E5E3]">
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
                onSelectTeam={(team) => setCurrentTeam(team)}
                onCreateTeam={handleCreateTeam}
                onUpdateTeam={handleUpdateTeam}
                onDeleteTeam={handleDeleteTeam}
            />
        </div>
    );
}
