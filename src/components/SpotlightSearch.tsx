"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    CheckSquare,
    LayoutGrid,
    List,
    Sun,
    Moon,
    FileText,
    Calendar,
    BarChart2,
    Bookmark,
    Trash2,
    User,
    Settings,
    Plus,
    Sliders,
    ArrowRight,
    CornerDownLeft,
    Clock,
    MapPin,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Task } from "../api";
import { playFeedback } from "../utils/feedback";

interface SpotlightSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onToggleTheme?: (e?: React.MouseEvent) => void;
    onOpenSystemSettings?: () => void;
}

type FilterCategory = "all" | "tasks" | "navigation" | "actions";

interface SearchItem {
    id: string;
    category: "tasks" | "navigation" | "actions";
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    shortcut?: string;
    onSelect: () => void;
}

export default function SpotlightSearch({
    isOpen,
    onClose,
    onToggleTheme,
    onOpenSystemSettings,
}: SpotlightSearchProps) {
    const router = useRouter();
    const {
        tasks,
        columns,
        setSelectedTaskId,
        setIsAddTaskOpen,
        setAddTaskColId,
        setIsConfigModalOpen,
        userRole,
    } = useWorkspace();

    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setCategoryFilter("all");
            setSelectedIndex(0);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    // Navigation items definition
    const navigationItems: SearchItem[] = useMemo(
        () => [
            {
                id: "nav-kanban",
                category: "navigation",
                title: "Task Board",
                subtitle: "Kanban board view with drag-and-drop columns",
                icon: <LayoutGrid className="w-4 h-4 text-[#888883]" />,
                shortcut: "G B",
                onSelect: () => {
                    router.push("/task-board");
                    onClose();
                },
            },
            {
                id: "nav-list",
                category: "navigation",
                title: "List View",
                subtitle: "Tabular overview with filters, grouping & CSV export",
                icon: <List className="w-4 h-4 text-[#888883]" />,
                shortcut: "G L",
                onSelect: () => {
                    router.push("/list");
                    onClose();
                },
            },
            {
                id: "nav-myday",
                category: "navigation",
                title: "My Day",
                subtitle: "Personal focus list and daily schedule",
                icon: <Sun className="w-4 h-4 text-[#888883]" />,
                shortcut: "G M",
                onSelect: () => {
                    router.push("/myday");
                    onClose();
                },
            },
            {
                id: "nav-knowledge",
                category: "navigation",
                title: "Knowledge Hub",
                subtitle: "Workspace notes, documentation & bookmarks",
                icon: <FileText className="w-4 h-4 text-[#888883]" />,
                shortcut: "G K",
                onSelect: () => {
                    router.push("/knowledge");
                    onClose();
                },
            },
            {
                id: "nav-dashboard",
                category: "navigation",
                title: "Dashboard",
                subtitle: "Team metrics, completion rates & activity charts",
                icon: <BarChart2 className="w-4 h-4 text-[#888883]" />,
                shortcut: "G D",
                onSelect: () => {
                    router.push("/dashboard");
                    onClose();
                },
            },
            {
                id: "nav-calendar",
                category: "navigation",
                title: "Calendar",
                subtitle: "Monthly & weekly task schedule view",
                icon: <Calendar className="w-4 h-4 text-[#888883]" />,
                shortcut: "G C",
                onSelect: () => {
                    router.push("/calendar");
                    onClose();
                },
            },
            {
                id: "nav-map",
                category: "navigation",
                title: "Map View",
                subtitle: "Location-tagged tasks and field activities",
                icon: <MapPin className="w-4 h-4 text-[#888883]" />,
                onSelect: () => {
                    router.push("/map");
                    onClose();
                },
            },
            {
                id: "nav-reports",
                category: "navigation",
                title: "Reports",
                subtitle: "Analytics, workload distribution & summaries",
                icon: <Clock className="w-4 h-4 text-[#888883]" />,
                onSelect: () => {
                    router.push("/reports");
                    onClose();
                },
            },
            {
                id: "nav-bookmarks",
                category: "navigation",
                title: "Bookmarks",
                subtitle: "Saved links and quick references",
                icon: <Bookmark className="w-4 h-4 text-[#888883]" />,
                onSelect: () => {
                    router.push("/bookmarks");
                    onClose();
                },
            },
            {
                id: "nav-trash",
                category: "navigation",
                title: "Trash",
                subtitle: "Deleted and archived tasks",
                icon: <Trash2 className="w-4 h-4 text-[#888883]" />,
                onSelect: () => {
                    router.push("/trash");
                    onClose();
                },
            },
            {
                id: "nav-profile",
                category: "navigation",
                title: "My Profile",
                subtitle: "Account settings, bio & user activity",
                icon: <User className="w-4 h-4 text-[#888883]" />,
                onSelect: () => {
                    router.push("/profile");
                    onClose();
                },
            },
        ],
        [router, onClose],
    );

    // Quick action items definition
    const actionItems: SearchItem[] = useMemo(() => {
        const items: SearchItem[] = [];

        if (userRole !== "OBSERVER") {
            items.push({
                id: "act-new-task",
                category: "actions",
                title: "Create New Task",
                subtitle: "Add a task to the default board column",
                icon: <Plus className="w-4 h-4 text-[#22863A]" />,
                shortcut: "N",
                onSelect: () => {
                    setAddTaskColId(columns[0]?.id || "");
                    setIsAddTaskOpen(true);
                    onClose();
                },
            });
        }

        if (onOpenSystemSettings) {
            items.push({
                id: "act-sys-settings",
                category: "actions",
                title: "System Preferences & Fonts",
                subtitle: "Customize themes, typography scale & pairings",
                icon: <Sliders className="w-4 h-4 text-[#888883]" />,
                shortcut: "⌘,",
                onSelect: () => {
                    onOpenSystemSettings();
                    onClose();
                },
            });
        }

        if (userRole === "LEADER") {
            items.push({
                id: "act-ws-config",
                category: "actions",
                title: "Workspace Settings",
                subtitle: "Manage team columns, members and permissions",
                icon: <Settings className="w-4 h-4 text-[#888883]" />,
                onSelect: () => {
                    setIsConfigModalOpen(true);
                    onClose();
                },
            });
        }

        if (onToggleTheme) {
            items.push({
                id: "act-toggle-theme",
                category: "actions",
                title: "Toggle Light / Dark Theme",
                subtitle: "Switch appearance with circular reveal animation",
                icon: <Moon className="w-4 h-4 text-[#B08800]" />,
                shortcut: "⌘T",
                onSelect: () => {
                    onToggleTheme();
                    onClose();
                },
            });
        }

        return items;
    }, [
        userRole,
        columns,
        setAddTaskColId,
        setIsAddTaskOpen,
        setIsConfigModalOpen,
        onOpenSystemSettings,
        onToggleTheme,
        onClose,
    ]);

    // Active Task items mapped to SearchItems
    const taskItems: SearchItem[] = useMemo(() => {
        const active = tasks.filter((t) => !t.isSoftDeleted && !t.isArchived);
        return active.map((task: Task) => {
            const col = columns.find((c) => c.id === task.columnId);
            const isDone =
                col?.isComplete ||
                col?.name.toLowerCase().includes("done") ||
                col?.name.toLowerCase().includes("complete");

            return {
                id: `task-${task.id}`,
                category: "tasks",
                title: task.title,
                subtitle:
                    task.description?.replace(/<[^>]*>/g, "").trim() ||
                    `Status: ${col?.name || "Pending"} • ${task.assignedTo?.name ? `Assigned to ${task.assignedTo.name}` : "Unassigned"}`,
                icon: (
                    <CheckSquare
                        className={`w-4 h-4 shrink-0 ${
                            isDone ? "text-[#22863A]" : "text-[#888883]"
                        }`}
                    />
                ),
                badge: col?.name || "Task",
                badgeColor: isDone ? "#22863A" : "#888883",
                onSelect: () => {
                    setSelectedTaskId(task.id);
                    onClose();
                },
            };
        });
    }, [tasks, columns, setSelectedTaskId, onClose]);

    // Filter and score results based on query
    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();

        let pool: SearchItem[] = [];
        if (categoryFilter === "all") {
            pool = [...taskItems, ...navigationItems, ...actionItems];
        } else if (categoryFilter === "tasks") {
            pool = taskItems;
        } else if (categoryFilter === "navigation") {
            pool = navigationItems;
        } else if (categoryFilter === "actions") {
            pool = actionItems;
        }

        if (!q) return pool.slice(0, 30);

        return pool
            .filter((item) => {
                const titleMatch = item.title.toLowerCase().includes(q);
                const subMatch = item.subtitle?.toLowerCase().includes(q);
                const badgeMatch = item.badge?.toLowerCase().includes(q);
                return titleMatch || subMatch || badgeMatch;
            })
            .slice(0, 30);
    }, [query, categoryFilter, taskItems, navigationItems, actionItems]);

    // Keep selectedIndex in bounds
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredItems]);

    // Keyboard navigation (Arrow keys, Enter, Escape, Tab)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                playFeedback("click");
                setSelectedIndex((prev) =>
                    prev < filteredItems.length - 1 ? prev + 1 : 0,
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                playFeedback("click");
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredItems.length - 1,
                );
            } else if (e.key === "Enter") {
                e.preventDefault();
                playFeedback("click");
                if (filteredItems[selectedIndex]) {
                    filteredItems[selectedIndex].onSelect();
                }
            } else if (e.key === "Tab") {
                e.preventDefault();
                playFeedback("click");
                const categories: FilterCategory[] = [
                    "all",
                    "tasks",
                    "navigation",
                    "actions",
                ];
                const curIdx = categories.indexOf(categoryFilter);
                const nextIdx = e.shiftKey
                    ? (curIdx - 1 + categories.length) % categories.length
                    : (curIdx + 1) % categories.length;
                setCategoryFilter(categories[nextIdx]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, categoryFilter, onClose]);

    // Scroll active item into view
    useEffect(() => {
        if (listRef.current) {
            const activeElem = listRef.current.querySelector(
                `[data-index="${selectedIndex}"]`,
            );
            if (activeElem) {
                activeElem.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[10vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in transition-opacity"
                onClick={onClose}
            />

            {/* Spotlight Modal Box */}
            <div
                className="relative w-full max-w-xl bg-white border border-[#E5E5E3] rounded-[3px] corner-brackets shadow-2xl overflow-hidden animate-scale-in flex flex-col text-left select-none"
                style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
            >
                {/* Search Bar Header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E5E3] bg-white">
                    <Search className="w-4 h-4 text-[#888883] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tasks, views, commands or settings… (⌘K)"
                        className="flex-1 text-[13px] text-[#1A1A1A] placeholder-[#888883] bg-transparent outline-none font-medium"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="text-[11px] text-[#888883] hover:text-[#1A1A1A] px-1 font-mono transition-colors"
                        >
                            ✕
                        </button>
                    )}
                    <span className="text-[10px] font-mono text-[#888883] border border-[#E5E5E3] bg-[#FAFAF9] px-1.5 py-0.5 rounded-[2px] shrink-0">
                        ESC
                    </span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAFAF9] border-b border-[#E5E5E3] overflow-x-auto text-[11px]">
                    {(
                        [
                            { key: "all", label: "All" },
                            { key: "tasks", label: "Tasks" },
                            { key: "navigation", label: "Navigation" },
                            { key: "actions", label: "Actions" },
                        ] as { key: FilterCategory; label: string }[]
                    ).map((cat) => (
                        <button
                            key={cat.key}
                            type="button"
                            onClick={() => setCategoryFilter(cat.key)}
                            className={`px-2.5 py-1 rounded-[2px] font-medium transition-colors cursor-pointer ${
                                categoryFilter === cat.key
                                    ? "bg-white text-[#1A1A1A] border border-[#E5E5E3] corner-brackets-4 shadow-sm"
                                    : "text-[#888883] hover:text-[#1A1A1A] hover:bg-[#F0F0EE]"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                    <span className="ml-auto text-[10px] text-[#888883] hidden sm:inline">
                        Tab to switch
                    </span>
                </div>

                {/* Search Results List */}
                <div
                    ref={listRef}
                    className="max-h-[380px] overflow-y-auto p-1.5 flex flex-col gap-0.5 divide-y divide-[#F5F5F3]"
                >
                    {filteredItems.length === 0 ? (
                        <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-1 text-[#888883]">
                            <p className="text-[12px] font-medium text-[#1A1A1A]">
                                No results found for &ldquo;{query}&rdquo;
                            </p>
                            <p className="text-[11px]">
                                Try searching with different keywords or switch
                                categories.
                            </p>
                        </div>
                    ) : (
                        filteredItems.map((item, idx) => {
                            const isSelected = idx === selectedIndex;
                            return (
                                <div
                                    key={item.id}
                                    data-index={idx}
                                    onClick={item.onSelect}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-[2px] transition-colors cursor-pointer ${
                                        isSelected
                                            ? "bg-[#FAFAF9] border border-[#E5E5E3] corner-brackets-4"
                                            : "border border-transparent hover:bg-[#FAFAF9]"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        <div className="shrink-0 p-1 bg-white border border-[#E5E5E3] rounded-[2px]">
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[12px] font-medium text-[#1A1A1A] truncate">
                                                    {item.title}
                                                </span>
                                                {item.badge && (
                                                    <span
                                                        className="text-[9px] px-1.5 py-0.2 rounded-[2px] border font-medium truncate shrink-0"
                                                        style={{
                                                            color:
                                                                item.badgeColor ||
                                                                "#888883",
                                                            borderColor:
                                                                item.badgeColor
                                                                    ? `${item.badgeColor}33`
                                                                    : "#E5E5E3",
                                                            backgroundColor:
                                                                item.badgeColor
                                                                    ? `${item.badgeColor}0D`
                                                                    : "#FAFAF9",
                                                        }}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {item.subtitle && (
                                                <span className="text-[10px] text-[#888883] truncate leading-tight mt-0.5">
                                                    {item.subtitle}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {item.shortcut && (
                                            <span className="text-[9px] font-mono text-[#888883] border border-[#E5E5E3] bg-white px-1.5 py-0.5 rounded-[2px]">
                                                {item.shortcut}
                                            </span>
                                        )}
                                        {isSelected && (
                                            <CornerDownLeft className="w-3 h-3 text-[#1A1A1A]" />
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Hotkey Legend */}
                <div className="px-3.5 py-2 border-t border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-between text-[10px] text-[#888883]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="font-mono border border-[#E5E5E3] bg-white px-1 rounded-[2px]">
                                ↑
                            </kbd>
                            <kbd className="font-mono border border-[#E5E5E3] bg-white px-1 rounded-[2px]">
                                ↓
                            </kbd>{" "}
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="font-mono border border-[#E5E5E3] bg-white px-1 rounded-[2px]">
                                ↵
                            </kbd>{" "}
                            to select
                        </span>
                    </div>
                    <span>Spotlight Search</span>
                </div>
            </div>
        </div>
    );
}
