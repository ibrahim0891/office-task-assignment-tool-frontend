"use client";

import React from "react";
import { Users, List, LayoutGrid, UserPlus, Edit3, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Team } from "@/api";

interface TeamDetailsHeaderProps {
    currentTeam: Team;
    membersCount: number;
    projectsCount: number;
    viewMode: "list" | "grid";
    onViewModeChange: (mode: "list" | "grid") => void;
    userRole: string;
    onOpenAddMember: () => void;
    onOpenEditTeam: () => void;
}

export function TeamDetailsHeader({
    currentTeam,
    membersCount,
    projectsCount,
    viewMode,
    onViewModeChange,
    userRole,
    onOpenAddMember,
    onOpenEditTeam,
}: TeamDetailsHeaderProps) {
    const isLeader = userRole === "LEADER";

    return (
        <div className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-card)] px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Team Emoji / Avatar + Title & Subtitle + Metric Pills */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] border border-[var(--app-border)] flex items-center justify-center text-xl shrink-0 shadow-3xs">
                    {currentTeam.emoji ? (
                        <span className="emoji-font leading-none">{currentTeam.emoji}</span>
                    ) : (
                        <Users className="w-5 h-5 text-[var(--app-muted)]" />
                    )}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--app-text)] leading-tight truncate">
                            {currentTeam.name}
                        </h1>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs,2px)] bg-[var(--app-bg)] border border-[var(--app-border)] text-[10px] text-[var(--app-muted)]">
                                <Users className="w-3 h-3 text-[var(--app-muted)]" />
                                <span className="font-semibold text-[var(--app-text)] tabular-nums">{membersCount}</span>
                                <span>members</span>
                            </span>

                            {projectsCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-xs,2px)] bg-[var(--app-bg)] border border-[var(--app-border)] text-[10px] text-[var(--app-muted)]">
                                    <FolderKanban className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span className="font-semibold text-[var(--app-text)] tabular-nums">{projectsCount}</span>
                                    <span>projects</span>
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-[11px] text-[var(--app-muted)] mt-0.5 truncate">
                        Personnel roster, workload distribution, and active deliverables
                    </p>
                </div>
            </div>

            {/* Right: View Mode Switcher + Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
                {/* Segmented View Mode Toggle */}
                <div className="inline-flex items-center bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[var(--radius-sm,4px)] p-0.5 text-xs font-medium shrink-0">
                    <button
                        type="button"
                        onClick={() => onViewModeChange("list")}
                        className={`p-1.5 rounded-[var(--radius-xs,2px)] transition-all cursor-pointer flex items-center gap-1.5 ${
                            viewMode === "list"
                                ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-3xs font-semibold border border-[var(--app-border)]"
                                : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                        }`}
                        title="List / Table View"
                    >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange("grid")}
                        className={`p-1.5 rounded-[var(--radius-xs,2px)] transition-all cursor-pointer flex items-center gap-1.5 ${
                            viewMode === "grid"
                                ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-3xs font-semibold border border-[var(--app-border)]"
                                : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                        }`}
                        title="Card / Grid View"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cards</span>
                    </button>
                </div>

                {/* Leader Actions */}
                {isLeader && (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Edit3 className="w-3.5 h-3.5" />}
                            onClick={onOpenEditTeam}
                            title="Edit Team Name and Emoji"
                        >
                            <span className="hidden md:inline">Edit Team</span>
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<UserPlus className="w-3.5 h-3.5" />}
                            onClick={onOpenAddMember}
                        >
                            <span>Add Member</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
