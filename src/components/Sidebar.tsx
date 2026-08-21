import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Kanban,
    List,
    Calendar,
    Sun,
    BarChart2,
    Trash2,
    Bell,
    SlidersHorizontal,
    FileCode,
    User as UserIcon,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Bookmark,
    Moon,
    Network,
    FolderKanban,
} from "lucide-react";
import { User, Team } from "../api";
import { CustomSelect } from "./ui/CustomSelect";

interface SidebarProps {
    currentUser: User;
    onLogout: () => void;
    teams: Team[];
    currentTeam: Team | null;
    setCurrentTeam: (team: Team) => void;
    onCreateTeamClick: () => void;
    currentView: string;
    setCurrentView?: (view: string) => void;
    toggleConfigModal: () => void;
    userRole: string;
    theme: string;
    onToggleTheme?: () => void;
}

export default function Sidebar({
    currentUser,
    onLogout,
    teams,
    currentTeam,
    setCurrentTeam,
    onCreateTeamClick,
    currentView,
    setCurrentView,
    toggleConfigModal,
    userRole,
    theme = "light",
    onToggleTheme,
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsProfileMenuOpen(false);
            }
        }
        if (isProfileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const views = [
        {
            id: "dashboard",
            href: "/dashboard",
            name: "Leader Dashboard",
            icon: LayoutDashboard,
            leaderOnly: false,
            leaderOrObserverOnly: true,
        },

        {
            id: "kanban",
            href: "/task-board",
            name: "Task Board",
            icon: Kanban,
            leaderOnly: false,
        },
        {
            id: "projects",
            href: "/projects",
            name: "Projects",
            icon: FolderKanban,
            leaderOnly: false,
        },
        {
            id: "list",
            href: "/list",
            name: "List View",
            icon: List,
            leaderOnly: false,
        },
        {
            id: "map",
            href: "/map",
            name: "Team Flow",
            icon: Network,
            leaderOnly: false,
            leaderOrObserverOnly: true,
        },
        {
            id: "calendar",
            href: "/calendar",
            name: "Calendar",
            icon: Calendar,
            leaderOnly: false,
        },
        {
            id: "reports",
            href: "/reports",
            name: "Reports",
            icon: BarChart2,
            leaderOnly: true,
        },
        {
            id: "knowledge",
            href: "/knowledge",
            name: "Docs & Knowledge Base",
            icon: BookOpen,
            leaderOnly: false,
        },
        {
            id: "bookmarks",
            href: "/bookmarks",
            name: "Bookmarks",
            icon: Bookmark,
            leaderOnly: false,
        },
        {
            id: "trash",
            href: "/trash",
            name: "Trash",
            icon: Trash2,
            leaderOnly: false,
        },
    ];

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "LEADER":
                return "text-[#CB2431] border-[#CB2431]/20";
            case "OBSERVER":
                return "text-[#B08800] border-[#B08800]/20";
            default:
                return "text-[#22863A] border-[#22863A]/20";
        }
    };

    return (
        <aside
            className={`${
                isCollapsed ? "w-16 p-2 overflow-visible" : "w-64 p-5"
            } bg-[var(--app-sidebar)] border-r border-[var(--app-border)] flex flex-col shrink-0 select-none transition-all duration-200 relative`}
        >
            <div
                className={`flex-1 flex flex-col gap-4 min-h-0 ${isCollapsed ? "overflow-visible" : "overflow-y-auto scrollbar-none"}`}
            >
                {/* Header & Toggle Button */}
                <div className="pb-3 border-b border-[var(--app-border)] flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex flex-col text-left select-none">
                            <h1 className="font-heading text-xl font-bold tracking-tight text-[var(--app-text)]">
                                SM Technology
                            </h1>
                            <p className="eyebrow mt-0.5">Assignment Core</p>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={
                            isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
                        }
                        className={`relative corner-brackets-4 p-1.5 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors flex items-center justify-center cursor-pointer ${
                            isCollapsed ? "mx-auto" : ""
                        }`}
                    >
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                            />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </button>
                </div>

                {/* Team Selector */}
                {!isCollapsed ? (
                    <div className="flex flex-col gap-2">
                        {currentTeam && (
                            <div className="text-[12px] font-semibold text-[var(--app-text)] truncate border-b border-dashed border-[var(--app-border)] pb-1.5 mb-1 flex items-center gap-1.5">
                                <span className="text-sm shrink-0 emoji-font">
                                    {currentTeam.emoji || "🧑‍💻"}
                                </span>
                                <span className="truncate">
                                    {currentTeam.name}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span className="eyebrow">Workspace</span>
                            <button
                                onClick={onCreateTeamClick}
                                className="relative corner-brackets-4 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-[10px] font-medium px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                                Manage
                            </button>
                        </div>
                        <CustomSelect
                            options={
                                teams.length === 0
                                    ? [{ value: "", label: "No Workspaces" }]
                                    : teams.map((t) => ({
                                          value: t.id,
                                          label: `${t.emoji || "🧑‍💻"} ${t.name}`,
                                      }))
                            }
                            value={currentTeam?.id || ""}
                            onChange={(val) => {
                                const t = teams.find((x) => x.id === val);
                                if (t) setCurrentTeam(t);
                            }}
                            className="w-full"
                            renderSelected={() => (
                                <span className="font-medium truncate text-[11px] text-[var(--app-text)]">
                                    {currentTeam?.name}
                                </span>
                            )}
                        />
                    </div>
                ) : (
                    <button
                        onClick={onCreateTeamClick}
                        className="w-9 h-9 mx-auto border border-[#E5E5E3] rounded-[3px] text-base text-[#1A1A1A] font-medium hover:bg-[#FAFAF9] flex items-center justify-center relative group cursor-pointer"
                        title="Manage Workspaces"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-[#555555]" />
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-white text-base rounded-[2px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                            Manage Workspaces
                        </div>
                    </button>
                )}

                {/* View Navigation */}
                <div className="flex flex-col gap-1 mt-1">
                    {!isCollapsed && (
                        <span className="eyebrow mb-1">Views</span>
                    )}
                    {views.map((v) => {
                        const Icon = v.icon;
                        const isActive = pathname === v.href;
                        const isLeaderOnly = v.leaderOnly;
                        const isLeaderOrObserverOnly = (v as any)
                            .leaderOrObserverOnly;
                        const isAllowed =
                            (!isLeaderOnly || userRole === "LEADER") &&
                            (!isLeaderOrObserverOnly ||
                                userRole === "LEADER" ||
                                userRole === "OBSERVER");
                        if (!isAllowed) return null;

                        return (
                            <Link
                                key={v.id}
                                href={v.href}
                                onClick={() => {
                                    if (setCurrentView) {
                                        setCurrentView(v.id);
                                    }
                                }}
                                className={`flex items-center transition-colors relative group ${
                                    isCollapsed
                                        ? "w-9 h-9 mx-auto justify-center rounded-[3px]"
                                        : "w-full justify-between px-2.5 py-2 rounded-[2px] gap-2.5"
                                } text-[12px] ${
                                    isActive
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold border border-[var(--app-border)] corner-brackets-4"
                                        : "text-[var(--app-muted)] hover:bg-[var(--app-hover-bg)] hover:text-[var(--app-text)]"
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {!isCollapsed && (
                                    <div className="flex-1 flex items-center justify-between truncate">
                                        <span className="truncate">
                                            {v.name}
                                        </span>
                                        {isLeaderOnly && (
                                            <span className="text-[9px] text-[#CB2431] font-medium ml-1">
                                                Lead
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Collapsed Tooltip */}
                                {isCollapsed && (
                                    <div className="absolute left-14 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#1A1A1A] text-white text-[11px] font-medium rounded-[3px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity shadow-md">
                                        {v.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div
                className={`border-t border-[var(--app-border)] flex flex-col gap-2 ${
                    isCollapsed ? "pt-3 px-0" : "pt-4 px-0"
                }`}
            >
                {/* Configure Columns & Theme Toggle */}
                {userRole === "LEADER" && (
                    <div className="flex flex-col gap-1 mb-1">
                        <button
                            type="button"
                            onClick={toggleConfigModal}
                            className={`flex items-center text-[11px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors relative group ${
                                isCollapsed
                                    ? "w-9 h-9 mx-auto justify-center rounded-[3px] border border-[var(--app-border)]"
                                    : "w-full gap-2 px-2.5 py-1.5 rounded-[3px]"
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                            {!isCollapsed && <span>Configure Columns</span>}

                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-white text-base rounded-[2px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                                    Configure Columns
                                </div>
                            )}
                        </button>
                    </div>
                )}

                {/* Divider Line */}
                {userRole === "LEADER" && (
                    <div className="border-t border-[var(--app-border)] my-1" />
                )}

                {/* User Session Profile Container */}
                <div
                    ref={menuRef}
                    className={`relative border border-[var(--app-border)] corner-brackets bg-[var(--app-card)] transition-all overflow-hidden ${
                        isCollapsed ? "p-0 group" : ""
                    }`}
                >
                    {/* Trigger Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (isCollapsed) {
                                router.push("/profile");
                            } else {
                                setIsProfileMenuOpen(!isProfileMenuOpen);
                            }
                        }}
                        className={`w-full flex items-center justify-between gap-2 p-2.5 hover:bg-[var(--app-hover-bg)] transition-colors relative cursor-pointer ${
                            isCollapsed ? "justify-center" : ""
                        }`}
                        title={isCollapsed ? "Profile Settings" : undefined}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {currentUser.avatarUrl ? (
                                <img
                                    src={currentUser.avatarUrl}
                                    alt={currentUser.name}
                                    className="w-7 h-7 rounded-full object-cover border border-[var(--app-border)] shrink-0"
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-bg)] flex items-center justify-center text-xs text-[var(--app-text)] font-semibold shrink-0">
                                    {currentUser.name
                                        ? currentUser.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")
                                              .toUpperCase()
                                              .slice(0, 2)
                                        : "U"}
                                </div>
                            )}
                            {!isCollapsed && (
                                <div className="text-left min-w-0">
                                    <div className="text-sm font-semibold text-[var(--app-text)] truncate">
                                        {currentUser.name}
                                    </div>
                                    <div className="text-xs text-[var(--app-muted)] truncate capitalize">
                                        {userRole.toLowerCase()}
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="text-[var(--app-muted)]">
                                {isProfileMenuOpen ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                )}
                            </div>
                        )}
                    </button>

                    {/* Inline Expandable Drawer (Expanded Sidebar Mode) */}
                    {!isCollapsed && isProfileMenuOpen && (
                        <div className="border-t border-[var(--app-border)] p-2 bg-[var(--app-bg)] flex flex-col gap-1 animate-fade-in">
                            <div className="px-2 py-1 text-xs text-[var(--app-muted)] border-b border-[var(--app-border)]/60 mb-0.5 truncate">
                                {currentUser.email}
                            </div>
                            <Link
                                href="/profile"
                                onClick={() => setIsProfileMenuOpen(false)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-[3px] text-xs text-[var(--app-text)] hover:bg-[var(--app-card)] hover:border hover:border-[var(--app-border)] transition-colors"
                            >
                                <UserIcon className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Profile Settings</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsProfileMenuOpen(false);
                                    onLogout();
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-[3px] text-xs text-[#CB2431] hover:bg-[#CB2431]/10 transition-colors text-left w-full cursor-pointer"
                            >
                                <span>Log out</span>
                            </button>
                        </div>
                    )}

                    {/* Tooltip in Collapsed mode */}
                    {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A1A1A] text-white text-xs rounded-[2px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                            Profile Settings ({currentUser.name})
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
