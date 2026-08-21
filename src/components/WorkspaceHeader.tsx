"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sun, Moon, Bell, Settings } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { CustomDatePicker } from "./ui/CustomDatePicker";

interface WorkspaceHeaderProps {
    viewLabel: string;
    theme: string;
    onToggleTheme: () => void;
    onOpenSystemSettings: () => void;
}

export default function WorkspaceHeader({
    viewLabel,
    theme,
    onToggleTheme,
    onOpenSystemSettings,
}: WorkspaceHeaderProps) {
    const pathname = usePathname();
    const {
        currentView,
        activeDateStr,
        setActiveDateStr,
        notifications,
        setIsNotificationsOpen,
        userRole,
        columns,
        setAddTaskColId,
        setIsAddTaskOpen,
    } = useWorkspace();

    const unreadCount = notifications.filter(
        (n) => !n.isRead && !n.isArchived,
    ).length;

    return (
        <header className="h-12 border-b border-[#E5E5E3] px-5 flex items-center justify-between shrink-0 select-none print:hidden bg-white">
            <div className="flex items-center gap-4">
                <span className="text-[11px] font-medium text-[#888883] border border-[#E5E5E3] px-2.5 py-1 rounded-[3px]">
                    {viewLabel}
                </span>

                {(currentView === "kanban" ||
                    currentView === "list" ||
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
                    onClick={onToggleTheme}
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
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#CB2431] text-white rounded-full w-4 h-4 text-[9px] font-medium flex items-center justify-center scale-90">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={onOpenSystemSettings}
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
    );
}
