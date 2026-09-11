"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FolderKanban,
    Kanban,
    List,
    Calendar,
    LayoutDashboard,
    Network,
    BarChart2,
    Users,
    BookOpen,
    Bookmark,
    Trash2,
    Plus,
} from "lucide-react";
import { DesktopNavDropdown } from "./DesktopNavDropdown";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { useWorkspace } from "../../context/WorkspaceContext";
import { NavItem } from "./types";

interface DesktopNavTierProps {
    userRole: string;
    viewLabel: string;
    onItemClick?: (id: string) => void;
}

export function DesktopNavTier({
    userRole,
    viewLabel,
    onItemClick,
}: DesktopNavTierProps) {
    const pathname = usePathname();
    const {
        currentView,
        activeDateStr,
        setActiveDateStr,
        columns,
        setAddTaskColId,
        setIsAddTaskOpen,
    } = useWorkspace();

    // Primary Workspace direct navigation items
    const primaryNavItems: NavItem[] = [
        {
            id: "projects",
            href: "/projects",
            name: "Projects",
            icon: FolderKanban,
        },
        {
            id: "kanban",
            href: "/task-board",
            name: "Task Board",
            icon: Kanban,
        },
        {
            id: "list",
            href: "/list",
            name: "List View",
            icon: List,
        },
        {
            id: "calendar",
            href: "/calendar",
            name: "Calendar",
            icon: Calendar,
        },
    ];

    // Overview dropdown items (role gated)
    const overviewItems: NavItem[] = [
        {
            id: "dashboard",
            href: "/dashboard",
            name: "Leader Dashboard",
            icon: LayoutDashboard,
            leaderOrObserverOnly: true,
        },
        {
            id: "map",
            href: "/map",
            name: "Team Flow",
            icon: Network,
            leaderOrObserverOnly: true,
        },
        {
            id: "reports",
            href: "/reports",
            name: "Reports",
            icon: BarChart2,
            leaderOnly: true,
        },
    ].filter((item) => {
        if (item.leaderOnly && userRole !== "LEADER") return false;
        if (
            item.leaderOrObserverOnly &&
            userRole !== "LEADER" &&
            userRole !== "OBSERVER"
        )
            return false;
        return true;
    });

    // Resources dropdown items
    const resourceItems: NavItem[] = [
        {
            id: "team-details",
            href: "/team-details",
            name: "Team Details",
            icon: Users,
        },
        {
            id: "knowledge",
            href: "/knowledge",
            name: "Docs & Knowledge Base",
            icon: BookOpen,
        },
        {
            id: "bookmarks",
            href: "/bookmarks",
            name: "Bookmarks",
            icon: Bookmark,
        },
        {
            id: "trash",
            href: "/trash",
            name: "Trash & Archive",
            icon: Trash2,
        },
    ];

    const showDatePicker =
        currentView === "kanban" ||
        currentView === "list" ||
        currentView === "dashboard" ||
        currentView === "map";

    return (
        <div className="h-10 border-b border-[var(--app-border)] bg-[var(--app-bg)] px-4 flex items-center justify-between gap-4 select-none shrink-0 overflow-x-auto scrollbar-none z-20">
            {/* ── Left Navigation Links & Menus ── */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Overview Dropdown (if permitted) */}
                {overviewItems.length > 0 && (
                    <DesktopNavDropdown
                        title="Overview"
                        items={overviewItems}
                        onItemClick={onItemClick}
                    />
                )}

                {/* Primary Direct Links */}
                {primaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/" &&
                            pathname?.startsWith(`${item.href}/`));

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => {
                                if (onItemClick) onItemClick(item.id);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-all rounded-[2px] shrink-0 ${
                                isActive
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold border border-[var(--app-border)] corner-brackets-4 shadow-3xs"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}

                {/* Resources Dropdown */}
                <DesktopNavDropdown
                    title="Resources"
                    items={resourceItems}
                    onItemClick={onItemClick}
                />
            </div>

            {/* ── Right Context Tools (Date Picker + New Task) ── */}
            <div className="flex items-center gap-2.5 shrink-0">
                {showDatePicker && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-[var(--app-muted)] font-medium">
                            Date:
                        </span>
                        <CustomDatePicker
                            value={activeDateStr}
                            onChange={(val) => setActiveDateStr(val)}
                            className="w-32 sm:w-36"
                        />
                    </div>
                )}

                {userRole !== "OBSERVER" &&
                    pathname !== "/profile" &&
                    !pathname.startsWith("/projects") && (
                        <button
                            type="button"
                            onClick={() => {
                                setAddTaskColId(columns[0]?.id || "");
                                setIsAddTaskOpen(true);
                            }}
                            className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-[11px] font-semibold px-3 py-1.5 rounded-[2px] flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            <span>New Task</span>
                        </button>
                    )}
            </div>
        </div>
    );
}
