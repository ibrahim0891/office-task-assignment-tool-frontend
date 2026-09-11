"use client";

import React from "react";
import {
    X,
    Calendar,
    Users,
    CheckSquare,
    Edit2,
    AlignLeft,
    Clock,
    FolderKanban,
    Layers,
    ArrowRight,
    CheckCircle2,
    Circle,
    AlertCircle,
} from "lucide-react";
import SideSheetWrapper from "../ui/SideSheetWrapper";
import { Button } from "../ui/Button";
import { UserAvatar } from "../ui/UserAvatar";
import { calculateTaskProgress } from "../../utils/projectProgress";
import { calculateRemainingDays, calculateDaySpan, formatDaySpan } from "../../utils/date";

interface MainTaskDetailDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    task: any;
    project: any;
    columnMap: Record<string, any>;
    canEdit?: boolean;
    onEditClick?: () => void;
    onOpenBoard?: () => void;
}

function getPriorityDetails(priority: string) {
    const p = (priority || "").toUpperCase();
    switch (p) {
        case "URGENT":
        case "Urgent":
            return {
                label: "Urgent",
                badgeCls: "text-[var(--priority-urgent,#DC2626)] bg-[var(--priority-urgent,#DC2626)]/10 border-[var(--priority-urgent,#DC2626)]/20",
                dotCls: "bg-[var(--priority-urgent,#DC2626)]",
            };
        case "HIGH":
        case "High":
            return {
                label: "High",
                badgeCls: "text-[var(--priority-high,#EA580C)] bg-[var(--priority-high,#EA580C)]/10 border-[var(--priority-high,#EA580C)]/20",
                dotCls: "bg-[var(--priority-high,#EA580C)]",
            };
        case "MEDIUM":
        case "Medium":
            return {
                label: "Medium",
                badgeCls: "text-[var(--priority-medium,#CA8A04)] bg-[var(--priority-medium,#CA8A04)]/10 border-[var(--priority-medium,#CA8A04)]/20",
                dotCls: "bg-[var(--priority-medium,#CA8A04)]",
            };
        default:
            return {
                label: "Low",
                badgeCls: "text-[var(--priority-low,#6B7280)] bg-[var(--priority-low,#6B7280)]/10 border-[var(--priority-low,#6B7280)]/20",
                dotCls: "bg-[var(--priority-low,#6B7280)]",
            };
    }
}

function getDerivedStatus(task: any, columnMap: Record<string, any>) {
    const progressPercent = calculateTaskProgress(task, columnMap);

    if (progressPercent === 100) {
        return {
            label: "Completed",
            cls: "text-[var(--status-completed,#15803D)] bg-[var(--status-completed,#15803D)]/10 border-[var(--status-completed,#15803D)]/20",
            dotCls: "bg-[var(--status-completed,#15803D)]",
        };
    }
    if (progressPercent >= 75) {
        return {
            label: "Under Review",
            cls: "text-[var(--status-at-risk,#D97706)] bg-[var(--status-at-risk,#D97706)]/10 border-[var(--status-at-risk,#D97706)]/20",
            dotCls: "bg-[var(--status-at-risk,#D97706)]",
        };
    }
    if (progressPercent >= 25) {
        return {
            label: "In Progress",
            cls: "text-[var(--status-in-progress,#7C3AED)] bg-[var(--status-in-progress,#7C3AED)]/10 border-[var(--status-in-progress,#7C3AED)]/20",
            dotCls: "bg-[var(--status-in-progress,#7C3AED)]",
        };
    }

    const col = columnMap[task.columnId];
    return {
        label: col?.name || "To Do",
        cls: "text-[var(--status-todo,#6B7280)] bg-[var(--app-hover-bg)] border-[var(--app-border)]",
        dotCls: "bg-[var(--status-todo,#6B7280)]",
    };
}

export default function MainTaskDetailDrawer({
    isOpen,
    onClose,
    task: incomingTask,
    project: incomingProject,
    columnMap,
    canEdit = false,
    onEditClick,
    onOpenBoard,
}: MainTaskDetailDrawerProps) {
    const lastTaskRef = React.useRef(incomingTask);
    if (incomingTask) {
        lastTaskRef.current = incomingTask;
    }
    const task = incomingTask || lastTaskRef.current;

    const lastProjectRef = React.useRef(incomingProject);
    if (incomingProject) {
        lastProjectRef.current = incomingProject;
    }
    const project = incomingProject || lastProjectRef.current;

    if (!task) return null;

    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter(
        (s: any) => s.isCompleted || s.status === "Completed" || s.status === "Done"
    ).length;
    const totalSubtasks = subtasks.length;
    const progressPercent = calculateTaskProgress(task, columnMap);

    const priorityDetails = getPriorityDetails(task.priority);
    const statusConfig = getDerivedStatus(task, columnMap);
    const column = columnMap[task.columnId];

    const remainingDays = calculateRemainingDays(task.dueDate);
    const durationDays =
        task.startDate && task.dueDate ? calculateDaySpan(task.startDate, task.dueDate) : null;

    // Normalize assignees list
    const assigneesList: any[] = [];
    if (Array.isArray(task.assignees)) {
        task.assignees.forEach((a: any) => {
            if (a.user) assigneesList.push(a.user);
            else assigneesList.push(a);
        });
    }

    return (
        <SideSheetWrapper
            isOpen={isOpen}
            onClose={onClose}
            width="lg"
            className="flex flex-col h-full bg-[var(--app-card)] border-l border-[var(--app-border)] text-left select-none text-[var(--app-text)]"
        >
            {/* ── Top Header ── */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                <div className="flex flex-col min-w-0 pr-4">
                    <span className="eyebrow text-[9.5px] text-[var(--app-muted)] tracking-wider">
                        MAIN TASK OVERVIEW & DETAILS
                    </span>
                    <h2 className="text-base font-bold text-[var(--app-text)] truncate leading-tight mt-0.5" title={task.title}>
                        {task.title}
                    </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {canEdit && onEditClick && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                onClose();
                                onEditClick();
                            }}
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                            className="font-medium"
                        >
                            Edit
                        </Button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] w-7 h-7 rounded-[3px] flex items-center justify-center transition-colors cursor-pointer"
                        title="Close Drawer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5.5 custom-scrollbar select-text">
                {/* ── Hero Status & Progress Card ── */}
                <div className="p-4 rounded-[3px] bg-[var(--app-bg)] border border-[var(--app-border)] flex flex-col gap-3.5 shadow-2xs">
                    {/* Top Row: Status Badge, Priority & Column Tag */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Status Badge */}
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-semibold ${statusConfig.cls}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${statusConfig.dotCls}`} />
                                <span>{statusConfig.label}</span>
                            </span>

                            {/* Priority Badge */}
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border text-xs font-semibold ${priorityDetails.badgeCls}`}
                            >
                                <span>Priority: {priorityDetails.label}</span>
                            </span>

                            {/* Column / Stage Badge */}
                            {column && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[var(--app-border)] bg-[var(--app-card)] text-xs text-[var(--app-muted)]">
                                    <Layers className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                    <span>{column.name}</span>
                                </span>
                            )}
                        </div>

                        {/* Overdue / Days Remaining Pill */}
                        {remainingDays && (
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-[2px] border ${
                                    remainingDays.isOverdue
                                        ? "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20"
                                        : "text-[var(--app-muted)] bg-[var(--app-card)] border-[var(--app-border)]"
                                }`}
                            >
                                {remainingDays.isOverdue
                                    ? `${remainingDays.days}d Overdue`
                                    : `${remainingDays.days}d Remaining`}
                            </span>
                        )}
                    </div>

                    {/* Timeline Date Range & Duration (Above Progress Section) */}
                    {(task.startDate || task.dueDate) && (
                        <div className="flex items-center justify-between text-xs text-[var(--app-muted)] pt-2 border-t border-[var(--app-border)]/60">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                                <span>
                                    {task.startDate && task.dueDate
                                        ? `${new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                        : task.dueDate
                                        ? `Due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                        : `Starts ${new Date(task.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                                </span>
                            </div>
                            {durationDays && (
                                <span className="font-semibold text-[var(--app-text)] tabular-nums bg-[var(--app-card)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] text-[11px]">
                                    {formatDaySpan(durationDays)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Progress Bar & Subtasks Stats */}
                    <div className="flex flex-col gap-1.5 pt-1 border-t border-[var(--app-border)]/60">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--app-muted)] font-medium flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Subtasks Progress</span>
                            </span>
                            <span className="font-semibold text-[var(--app-text)] tabular-nums">
                                {progressPercent}% ({doneSubtasks}/{totalSubtasks} completed)
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--app-border)] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                    progressPercent === 100
                                        ? "bg-[var(--color-success,#22863A)]"
                                        : "bg-[var(--color-accent,#00D26A)]"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Key Task Metrics Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-1">
                        <span className="text-[10px] text-[var(--app-muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                            <span>Timeline</span>
                        </span>
                        <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                            {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                  })
                                : "No due date"}
                        </span>
                    </div>

                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-1">
                        <span className="text-[10px] text-[var(--app-muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                            <span>Duration</span>
                        </span>
                        <span className="text-xs font-semibold text-[var(--app-text)]">
                            {durationDays ? formatDaySpan(durationDays) : "—"}
                        </span>
                    </div>

                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-1 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-[var(--app-muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-[var(--app-muted)]" />
                            <span>Assigned</span>
                        </span>
                        <span className="text-xs font-semibold text-[var(--app-text)]">
                            {assigneesList.length} {assigneesList.length === 1 ? "Member" : "Members"}
                        </span>
                    </div>
                </div>

                {/* ── Description Section (TipTap Rendered) ── */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 pb-1 border-b border-[var(--app-border)]/60">
                        <AlignLeft className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                        <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                            Description & Scope
                        </h3>
                    </div>

                    {task.description ? (
                        <div className="p-4 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] text-xs leading-relaxed text-[var(--app-text)]/90 prose prose-xs sm:prose-sm dark:prose-invert max-w-none break-words select-text [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[var(--app-border)] [&_th]:p-2 [&_th]:bg-[var(--app-card)] [&_td]:border [&_td]:border-[var(--app-border)] [&_td]:p-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-3 [&_blockquote]:italic">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: task.description,
                                }}
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-[var(--app-bg)] border border-dashed border-[var(--app-border)] rounded-[3px] text-center text-xs text-[var(--app-muted)] italic">
                            No description provided for this task.
                        </div>
                    )}
                </div>

                {/* ── Subtasks Breakdown List ── */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--app-border)]/60">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                                Subtasks Checklist ({subtasks.length})
                            </h3>
                        </div>
                        {subtasks.length > 0 && (
                            <span className="text-[11px] text-[var(--app-muted)] font-medium">
                                {doneSubtasks}/{totalSubtasks} completed
                            </span>
                        )}
                    </div>

                    {subtasks.length === 0 ? (
                        <div className="p-3 bg-[var(--app-bg)] border border-dashed border-[var(--app-border)] rounded-[3px] text-center text-xs text-[var(--app-muted)] italic">
                            No subtasks created yet for this main task.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                            {subtasks.map((st: any) => {
                                const isSubtaskDone =
                                    st.isCompleted || st.status === "Completed" || st.status === "Done";
                                return (
                                    <div
                                        key={st.id}
                                        className="flex items-center justify-between p-2.5 rounded-[3px] bg-[var(--app-bg)] border border-[var(--app-border)] text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {isSubtaskDone ? (
                                                <CheckCircle2 className="w-4 h-4 text-[var(--color-success,#15803D)] shrink-0" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-[var(--app-muted)] shrink-0" />
                                            )}
                                            <span
                                                className={`font-medium truncate ${
                                                    isSubtaskDone
                                                        ? "line-through text-[var(--app-muted)]"
                                                        : "text-[var(--app-text)]"
                                                }`}
                                            >
                                                {st.title}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {st.assignedTo && (
                                                <UserAvatar
                                                    name={st.assignedTo.name || st.assignedTo.fullName}
                                                    avatarUrl={st.assignedTo.avatarUrl}
                                                    size="xs"
                                                    title={st.assignedTo.name || st.assignedTo.fullName}
                                                />
                                            )}
                                            {st.dueDate && (
                                                <span className="text-[10px] text-[var(--app-muted)] tabular-nums">
                                                    {new Date(st.dueDate).toLocaleDateString(undefined, {
                                                        month: "numeric",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Assigned Members ── */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--app-border)]/60">
                        <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            <h3 className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                                Assigned Members ({assigneesList.length})
                            </h3>
                        </div>
                    </div>

                    {assigneesList.length === 0 ? (
                        <div className="p-3 bg-[var(--app-bg)] border border-dashed border-[var(--app-border)] rounded-[3px] text-center text-xs text-[var(--app-muted)] italic">
                            No members assigned to this main task yet.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                            {assigneesList.map((user: any, idx: number) => {
                                const name = user.name || user.fullName || "User";
                                const avatarUrl = user.avatarUrl || user.user?.avatarUrl;

                                return (
                                    <div
                                        key={user.id || idx}
                                        className="flex items-center justify-between p-2.5 rounded-[3px] bg-[var(--app-bg)] border border-[var(--app-border)]"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <UserAvatar
                                                name={name}
                                                avatarUrl={avatarUrl}
                                                size="sm"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                    {name}
                                                </span>
                                                {user.email && (
                                                    <span className="text-[10px] text-[var(--app-muted)] truncate">
                                                        {user.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {user.role && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[var(--app-muted)]">
                                                {user.role}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Fixed Footer Action Bar ── */}
            <div className="px-6 py-4 border-t border-[var(--app-border)] bg-[var(--app-card)] shrink-0 flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onClose}
                >
                    Close
                </Button>

                {onOpenBoard && (
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => {
                            onClose();
                            onOpenBoard();
                        }}
                        icon={<ArrowRight className="w-4 h-4" />}
                    >
                        Open Subtask Board
                    </Button>
                )}
            </div>
        </SideSheetWrapper>
    );
}
