"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
    Sun,
    Moon,
    Bell,
    Settings,
    Search,
    Download,
    SlidersHorizontal,
    User as UserIcon,
    ChevronDown,
    LogOut,
} from "lucide-react";
import { User, Team } from "../../api";
import { DesktopWorkspaceMenu } from "./DesktopWorkspaceMenu";
import { UserAvatar } from "../ui/UserAvatar";
import { useWorkspace } from "../../context/WorkspaceContext";

interface DesktopAppTierProps {
    currentUser: User;
    teams: Team[];
    currentTeam: Team | null;
    setCurrentTeam: (team: Team) => void;
    onCreateTeamClick: () => void;
    toggleConfigModal: () => void;
    userRole: string;
    theme: string;
    onToggleTheme: (e?: React.MouseEvent) => void;
    onOpenSystemSettings: () => void;
    onOpenSpotlight: () => void;
    onLogout: () => void;
    isStandalone?: boolean;
    onOpenPwaInstall?: () => void;
}

export function DesktopAppTier({
    currentUser,
    teams,
    currentTeam,
    setCurrentTeam,
    onCreateTeamClick,
    toggleConfigModal,
    userRole,
    theme,
    onToggleTheme,
    onOpenSystemSettings,
    onOpenSpotlight,
    onLogout,
    isStandalone,
    onOpenPwaInstall,
}: DesktopAppTierProps) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileCoords, setProfileCoords] = useState<{ top: number; left: number }>({
        top: 0,
        left: 0,
    });
    const profileTriggerRef = useRef<HTMLButtonElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const { notifications, setIsNotificationsOpen } = useWorkspace();
    const unreadCount = notifications.filter(
        (n) => !n.isRead && !n.isArchived,
    ).length;

    const updateProfileCoords = () => {
        if (profileTriggerRef.current) {
            const rect = profileTriggerRef.current.getBoundingClientRect();
            setProfileCoords({
                top: rect.bottom + 6,
                left: Math.max(12, rect.right - 240),
            });
        }
    };

    const handleToggleProfile = () => {
        if (!isProfileOpen) {
            updateProfileCoords();
        }
        setIsProfileOpen(!isProfileOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileTriggerRef.current &&
                !profileTriggerRef.current.contains(event.target as Node) &&
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                setIsProfileOpen(false);
            }
        };

        const handleScrollOrResize = () => {
            if (isProfileOpen) {
                updateProfileCoords();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isProfileOpen) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScrollOrResize, true);
            window.addEventListener("resize", handleScrollOrResize);
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScrollOrResize, true);
            window.removeEventListener("resize", handleScrollOrResize);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isProfileOpen]);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "LEADER":
                return "text-[#CB2431] border-[#CB2431]/20 bg-[#CB2431]/5";
            case "OBSERVER":
                return "text-[#B08800] border-[#B08800]/20 bg-[#B08800]/5";
            default:
                return "text-[#22863A] border-[#22863A]/20 bg-[#22863A]/5";
        }
    };

    return (
        <div className="h-11 border-b border-[var(--app-border)] bg-[var(--app-card)] px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
            {/* ── Left: App Brand + Workspace Selector ── */}
            <div className="flex items-center gap-2.5 min-w-0">
                <Link
                    href="/projects"
                    className="flex items-center gap-2 text-left shrink-0 group"
                >
                    <img
                        src="/icon.png"
                        alt="OfficeTask"
                        className="w-6 h-6 object-contain rounded-sm overflow-hidden"
                    />
                    <div className="flex items-center gap-1.5">
                        <span className="font-heading text-sm font-bold tracking-tight text-[var(--app-text)]">
                            OfficeTask
                        </span>
                        {process.env.NEXT_PUBLIC_SHOW_EARLY_RELEASE_TAG ===
                            "true" && (
                            <span className="text-[8px] font-semibold bg-[#CB2431]/10 text-[#CB2431] px-1 py-0.2 rounded-[2px] uppercase tracking-wider">
                                Early
                            </span>
                        )}
                    </div>
                </Link>

                <div className="h-4 w-px bg-[var(--app-border)] mx-0.5 shrink-0" />

                {/* Rich Dedicated Workspace Switcher Menu */}
                <DesktopWorkspaceMenu
                    teams={teams}
                    currentTeam={currentTeam}
                    setCurrentTeam={setCurrentTeam}
                    onManageWorkspacesClick={onCreateTeamClick}
                />
            </div>

            {/* ── Center: Spotlight Search Trigger ── */}
            <div className="flex-1 max-w-md hidden md:flex justify-center">
                <button
                    type="button"
                    onClick={onOpenSpotlight}
                    className="w-full max-w-sm flex items-center justify-between px-3 py-1 bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[2px] text-[11px] text-[var(--app-muted)] transition-all cursor-pointer shadow-3xs"
                    title="Search workspace (⌘K)"
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        <span>Search tasks, docs, projects…</span>
                    </div>
                    <kbd className="inline-flex items-center text-[9px] font-mono border border-[var(--app-border)] bg-[var(--app-card)] px-1.5 py-0.2 rounded-[2px] text-[var(--app-muted)]">
                        ⌘K
                    </kbd>
                </button>
            </div>

            {/* ── Right: Utilities & Profile ── */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Mobile Search Button */}
                <button
                    type="button"
                    onClick={onOpenSpotlight}
                    className="md:hidden relative corner-brackets-4 p-1.5 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors flex items-center justify-center cursor-pointer"
                    title="Search (⌘K)"
                >
                    <Search className="w-3.5 h-3.5" />
                </button>

                {/* Configure Columns (Leader only) */}
                {userRole === "LEADER" && (
                    <button
                        type="button"
                        onClick={toggleConfigModal}
                        className="hidden lg:flex items-center gap-1.5 relative corner-brackets-4 px-2.5 py-1 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors cursor-pointer text-[11px]"
                        title="Configure Columns"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Columns</span>
                    </button>
                )}

                {/* PWA Install */}
                {!isStandalone && onOpenPwaInstall && (
                    <button
                        type="button"
                        onClick={onOpenPwaInstall}
                        className="hidden sm:flex items-center gap-1.5 relative corner-brackets-4 px-2.5 py-1 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors cursor-pointer text-[11px]"
                        title="Install Desktop App"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install</span>
                    </button>
                )}

                {/* Theme Switcher */}
                <button
                    type="button"
                    onClick={(e) => onToggleTheme(e)}
                    className="relative corner-brackets-4 p-1.5 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors flex items-center justify-center cursor-pointer"
                    title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
                >
                    {theme !== "light" ? (
                        <Sun className="w-3.5 h-3.5" />
                    ) : (
                        <Moon className="w-3.5 h-3.5" />
                    )}
                </button>

                {/* Notifications Center */}
                <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((p) => !p)}
                    className="relative corner-brackets-4 p-1.5 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors flex items-center justify-center cursor-pointer"
                    title="Notifications"
                >
                    <Bell className="w-3.5 h-3.5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#CB2431] text-white rounded-full w-3.5 h-3.5 text-[8px] font-bold flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>

                {/* System Preferences */}
                <button
                    type="button"
                    onClick={onOpenSystemSettings}
                    className="relative corner-brackets-4 p-1.5 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors flex items-center justify-center cursor-pointer"
                    title="System Preferences"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>

                {/* ── User Profile Menu Trigger ── */}
                <div className="relative">
                    <button
                        ref={profileTriggerRef}
                        type="button"
                        onClick={handleToggleProfile}
                        className={`flex items-center gap-2 p-1 pl-1.5 border rounded-[2px] transition-all cursor-pointer ${
                            isProfileOpen
                                ? "border-[var(--color-accent)] bg-[var(--app-hover-bg)] ring-1 ring-[var(--color-accent)]/20"
                                : "border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)]"
                        }`}
                    >
                        <UserAvatar
                            name={currentUser.fullName}
                            avatarUrl={currentUser.avatarUrl}
                            size="xs"
                        />
                        <span className="hidden sm:inline text-[11px] font-semibold text-[var(--app-text)] max-w-[90px] truncate">
                            {currentUser.fullName?.split(" ")[0]}
                        </span>
                        <ChevronDown
                            className={`w-3 h-3 text-[var(--app-muted)] transition-transform duration-150 ${
                                isProfileOpen ? "rotate-180 text-[var(--app-text)]" : ""
                            }`}
                        />
                    </button>

                    {/* Portal User Profile Dropdown */}
                    {isProfileOpen &&
                        typeof window !== "undefined" &&
                        createPortal(
                            <div
                                ref={profileMenuRef}
                                style={{
                                    position: "fixed",
                                    top: `${profileCoords.top}px`,
                                    left: `${profileCoords.left}px`,
                                    width: "240px",
                                    zIndex: 999999,
                                }}
                                className="bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets shadow-float rounded-[3px] p-2 animate-fade-in flex flex-col gap-1 text-left"
                            >
                                {/* Profile Info Header */}
                                <div className="p-2 bg-[var(--app-bg)] rounded-[2px] border border-[var(--app-border)]/60 flex items-center gap-2.5">
                                    <UserAvatar
                                        name={currentUser.fullName}
                                        avatarUrl={currentUser.avatarUrl}
                                        size="sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] font-semibold text-[var(--app-text)] truncate">
                                            {currentUser.fullName}
                                        </div>
                                        <div className="text-[10px] text-[var(--app-muted)] truncate">
                                            {currentUser.email}
                                        </div>
                                        <span
                                            className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 mt-1 border rounded-[2px] ${getRoleBadge(
                                                userRole,
                                            )}`}
                                        >
                                            {userRole}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-[var(--app-border)]/70 my-1" />

                                {/* Menu Links */}
                                <Link
                                    href="/profile"
                                    onClick={() => setIsProfileOpen(false)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-[12px] text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors"
                                >
                                    <UserIcon className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                    <span>Profile Settings</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        onOpenSystemSettings();
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-[12px] text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors w-full text-left cursor-pointer"
                                >
                                    <Settings className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                    <span>Appearance & Layout</span>
                                </button>

                                {userRole === "LEADER" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            toggleConfigModal();
                                        }}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-[12px] text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors w-full text-left cursor-pointer"
                                    >
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                        <span>Configure Columns</span>
                                    </button>
                                )}

                                <div className="border-t border-[var(--app-border)]/70 my-1" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        onLogout();
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-[12px] text-[#CB2431] hover:bg-[#CB2431]/10 transition-colors w-full text-left cursor-pointer"
                                >
                                    <LogOut className="w-3.5 h-3.5 text-[#CB2431]" />
                                    <span>Log out</span>
                                </button>
                            </div>,
                            document.body,
                        )}
                </div>
            </div>
        </div>
    );
}
