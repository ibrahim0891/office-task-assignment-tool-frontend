"use client";

import React from "react";
import Link from "next/link";
import { 
    Shield, 
    ArrowUpRight, 
    Calendar, 
    CheckCircle2, 
    AlertCircle, 
    Briefcase, 
    Building2,
    Mail,
    Users,
    Layers
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Task, TaskColumn, Team, User } from "@/api";
import { extractDateString, parseLocalDate } from "@/utils/date";

interface TeamSidebarSummaryProps {
    currentTeam: Team;
    currentUser: User;
    userRole: string;
    leaders: { user: User; role: string }[];
    teamMembersCount: number;
    columns: TaskColumn[];
    projectsCount: number;
    userTasks: Task[];
    onTaskSelect: (taskId: string) => void;
    onMemberSelect: (user: User) => void;
}

function formatSafeDueDate(dueDate?: string | null): string {
    if (!dueDate) return "";
    const dateStr = extractDateString(dueDate);
    if (!dateStr) return "";
    try {
        const d = parseLocalDate(dateStr);
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

function getPriorityColor(priority: string) {
    switch (priority) {
        case "URGENT":
            return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
        case "HIGH":
            return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
        case "MEDIUM":
            return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
        default:
            return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
    }
}

export function TeamSidebarSummary({
    currentTeam,
    currentUser,
    userRole,
    leaders,
    teamMembersCount,
    columns,
    projectsCount,
    userTasks,
    onTaskSelect,
    onMemberSelect,
}: TeamSidebarSummaryProps) {
    const completedColumnIds = new Set(
        columns.filter((c) => c.isComplete).map((c) => c.id)
    );

    const pendingTasks = userTasks.filter(
        (t) => !completedColumnIds.has(t.columnId) && !t.column?.isComplete && !t.isSoftDeleted && !t.isArchived
    );

    const urgentCount = userTasks.filter((t) => t.priority === "URGENT").length;
    const highCount = userTasks.filter((t) => t.priority === "HIGH").length;
    const mediumCount = userTasks.filter((t) => t.priority === "MEDIUM").length;
    const lowCount = userTasks.filter((t) => t.priority === "LOW").length;
    const totalUserTasks = userTasks.length;

    return (
        <div className="flex flex-col gap-5">
            {/* 1. Team Leadership Spotlight */}
            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[var(--radius-card,8px)] flex flex-col gap-3 shadow-3xs">
                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--color-accent)]" />
                        <h3 className="text-xs font-semibold text-[var(--app-text)]">
                            Team Leadership
                        </h3>
                    </div>
                    <span className="text-[10px] text-[var(--app-muted)]">
                        {leaders.length} {leaders.length === 1 ? "Leader" : "Leaders"}
                    </span>
                </div>

                {leaders.length === 0 ? (
                    <p className="text-xs text-[var(--app-muted)] py-2 text-center">
                        No designated leader assigned yet.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {leaders.map(({ user }) => {
                            const name = user.fullName || user.name || "Leader";
                            const isSelf = user.id === currentUser.id;
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => onMemberSelect(user)}
                                    className="p-2 rounded-[var(--radius-sm,4px)] bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] transition-colors cursor-pointer flex items-center justify-between gap-2.5"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <UserAvatar
                                            name={name}
                                            avatarUrl={user.avatarUrl}
                                            size="sm"
                                            showBorder={false}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                    {name}
                                                </span>
                                                {isSelf && (
                                                    <span className="text-[10px] text-[var(--app-muted)]">
                                                        (You)
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-[var(--app-muted)] truncate block">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${user.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Email ${name}`}
                                        className="p-1 rounded-[var(--radius-xs,2px)] text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors shrink-0"
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 2. Workspace Overview Info */}
            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[var(--radius-card,8px)] flex flex-col gap-3 shadow-3xs">
                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[var(--app-muted)]" />
                        <h3 className="text-xs font-semibold text-[var(--app-text)]">
                            Workspace Info
                        </h3>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                        {userRole}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[var(--app-bg)] rounded-[var(--radius-sm,4px)] border border-[var(--app-border)] flex flex-col">
                        <span className="text-[10px] text-[var(--app-muted)]">Team Roster</span>
                        <span className="text-sm font-semibold text-[var(--app-text)] mt-0.5">
                            {teamMembersCount} members
                        </span>
                    </div>

                    <div className="p-2.5 bg-[var(--app-bg)] rounded-[var(--radius-sm,4px)] border border-[var(--app-border)] flex flex-col">
                        <span className="text-[10px] text-[var(--app-muted)]">Active Projects</span>
                        <span className="text-sm font-semibold text-[var(--app-text)] mt-0.5">
                            {projectsCount} active
                        </span>
                    </div>

                    <div className="p-2.5 bg-[var(--app-bg)] rounded-[var(--radius-sm,4px)] border border-[var(--app-border)] flex flex-col">
                        <span className="text-[10px] text-[var(--app-muted)]">Workflow Stages</span>
                        <span className="text-sm font-semibold text-[var(--app-text)] mt-0.5">
                            {columns.length} columns
                        </span>
                    </div>

                    <div className="p-2.5 bg-[var(--app-bg)] rounded-[var(--radius-sm,4px)] border border-[var(--app-border)] flex flex-col">
                        <span className="text-[10px] text-[var(--app-muted)]">Your Role</span>
                        <span className="text-sm font-semibold text-[var(--app-text)] mt-0.5 capitalize">
                            {userRole.toLowerCase()}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. My Active Tasks (Interactive + Click to open TaskModal) */}
            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[var(--radius-card,8px)] flex flex-col gap-3 shadow-3xs">
                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[var(--app-muted)]" />
                        <h3 className="text-xs font-semibold text-[var(--app-text)]">
                            My Active Tasks
                        </h3>
                    </div>
                    <Link
                        href="/task-board"
                        className="text-[11px] text-[var(--app-muted)] hover:text-[var(--app-text)] flex items-center gap-1 hover:underline"
                    >
                        <span>Board</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>

                {pendingTasks.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-0.5">
                        {pendingTasks.map((t) => {
                            const formattedDate = formatSafeDueDate(t.dueDate);
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => onTaskSelect(t.id)}
                                    className="p-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] hover:border-[var(--color-accent)] rounded-[var(--radius-sm,4px)] flex flex-col gap-1.5 text-xs transition-colors cursor-pointer group"
                                    title="Click to view and edit task details"
                                >
                                    <div className="font-medium text-[var(--app-text)] group-hover:text-[var(--color-accent)] truncate transition-colors">
                                        {t.title}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-[var(--app-muted)]">
                                        <span className={`px-1.5 py-0.2 rounded-[var(--radius-xs,2px)] font-semibold border ${getPriorityColor(t.priority)}`}>
                                            {t.priority}
                                        </span>
                                        {formattedDate && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 opacity-60" />
                                                <span>Due {formattedDate}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-[var(--app-muted)] py-4 text-center">
                        No pending tasks assigned to you in this team.
                    </p>
                )}
            </div>

            {/* 4. Priority Breakdown Widget */}
            <div className="bg-[var(--app-card)] border border-[var(--app-border)] p-4 rounded-[var(--radius-card,8px)] flex flex-col gap-3 shadow-3xs">
                <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-2.5">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[var(--app-muted)]" />
                        <h3 className="text-xs font-semibold text-[var(--app-text)]">
                            Task Priority Ratio
                        </h3>
                    </div>
                    <span className="text-[10px] text-[var(--app-muted)]">
                        {totalUserTasks} personal
                    </span>
                </div>

                <div className="flex flex-col gap-2.5">
                    {/* Urgent */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--priority-urgent)] font-medium">Urgent</span>
                            <span className="font-semibold text-[var(--app-text)]">{urgentCount}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                            <div
                                className="h-full bg-[var(--priority-urgent)] rounded-full transition-all"
                                style={{ width: `${totalUserTasks > 0 ? (urgentCount / totalUserTasks) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* High */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--priority-high)] font-medium">High</span>
                            <span className="font-semibold text-[var(--app-text)]">{highCount}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                            <div
                                className="h-full bg-[var(--priority-high)] rounded-full transition-all"
                                style={{ width: `${totalUserTasks > 0 ? (highCount / totalUserTasks) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Medium */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--priority-medium)] font-medium">Medium</span>
                            <span className="font-semibold text-[var(--app-text)]">{mediumCount}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                            <div
                                className="h-full bg-[var(--priority-medium)] rounded-full transition-all"
                                style={{ width: `${totalUserTasks > 0 ? (mediumCount / totalUserTasks) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    {/* Low */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--priority-low)] font-medium">Low</span>
                            <span className="font-semibold text-[var(--app-text)]">{lowCount}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--app-bg)] rounded-full overflow-hidden border border-[var(--app-border)]">
                            <div
                                className="h-full bg-[var(--priority-low)] rounded-full transition-all"
                                style={{ width: `${totalUserTasks > 0 ? (lowCount / totalUserTasks) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
