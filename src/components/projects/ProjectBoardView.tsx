"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Plus, 
    Search, 
    Calendar, 
    CalendarRange, 
    ChevronRight, 
    CheckCircle2, 
    AlertCircle, 
    Layers, 
    Clock, 
    Edit2, 
    User, 
    LayoutGrid, 
    List, 
    X,
    ListTodo,
    CheckSquare,
    ArrowRight,
    Info,
    SlidersHorizontal,
    ChevronDown,
    Folder,
    FolderPlus
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Button } from "../ui/Button";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { UserAvatar } from "../ui/UserAvatar";
import CreateProjectTaskModal from "./CreateProjectTaskModal";
import UpdateProjectTaskModal from "./UpdateProjectTaskModal";
import MainTaskDetailDrawer from "./MainTaskDetailDrawer";
import ManageProjectTaskFoldersDrawer from "./ManageProjectTaskFoldersDrawer";
import MoveTasksToFolderModal from "./MoveTasksToFolderModal";
import BulkUpdateTasksModal from "./BulkUpdateTasksModal";
import PrioritySelectBadge from "./PrioritySelectBadge";
import { api } from "../../api";
import toast from "react-hot-toast";
import { calculateTaskProgress } from "../../utils/projectProgress";
import { getProjectPermissions } from "../../utils/projectPermissions";
import { getLocalDateString, extractDateString, calculateDaySpan, formatDaySpan } from "../../utils/date";

const PRIORITY_OPTIONS: SelectOption[] = [
    { value: "ALL", label: "All Priorities" },
    { value: "URGENT", label: "Urgent" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

const STATUS_OPTIONS: SelectOption[] = [
    { value: "ALL", label: "All Statuses" },
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "COMPLETED", label: "Completed" },
];

function stripHtml(html: string) {
    if (!html) return "";
    return html
        .replace(/<\/(p|li|h[1-6]|div)>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function getPriorityDetails(priority: string) {
    const p = (priority || "").toUpperCase();
    switch (p) {
        case "URGENT":
        case "Urgent":
            return {
                label: "Urgent",
                badgeCls: "text-[var(--priority-urgent,#CB2431)] bg-[var(--priority-urgent,#CB2431)]/10 border-[var(--priority-urgent,#CB2431)]/20",
                accentBorder: "border-l-[3.5px] border-l-[var(--priority-urgent,#CB2431)]",
                dotCls: "bg-[var(--priority-urgent,#CB2431)]"
            };
        case "HIGH":
        case "High":
            return {
                label: "High",
                badgeCls: "text-[var(--priority-high,#EA580C)] bg-[var(--priority-high,#EA580C)]/10 border-[var(--priority-high,#EA580C)]/20",
                accentBorder: "border-l-[3.5px] border-l-[var(--priority-high,#EA580C)]",
                dotCls: "bg-[var(--priority-high,#EA580C)]"
            };
        case "MEDIUM":
        case "Medium":
            return {
                label: "Medium",
                badgeCls: "text-[var(--priority-medium,#CA8A04)] bg-[var(--priority-medium,#CA8A04)]/10 border-[var(--priority-medium,#CA8A04)]/20",
                accentBorder: "border-l-[3.5px] border-l-[var(--priority-medium,#CA8A04)]",
                dotCls: "bg-[var(--priority-medium,#CA8A04)]"
            };
        default:
            return {
                label: "Low",
                badgeCls: "text-[var(--priority-low,#6B7280)] bg-[var(--priority-low,#6B7280)]/10 border-[var(--priority-low,#6B7280)]/20",
                accentBorder: "border-l-[3.5px] border-l-[var(--priority-low,#6B7280)]",
                dotCls: "bg-[var(--priority-low,#6B7280)]"
            };
    }
}

function getRiskBadge(riskLevel: string) {
    switch (riskLevel) {
        case "AT_RISK":
        case "AtRisk": return { label: "At Risk", cls: "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20" };
        case "OVERDUE":
        case "Overdue": return { label: "Overdue", cls: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20" };
        case "CRITICAL_SLA":
        case "CriticalSLA": return { label: "Overdue", cls: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20" };
        default: return null;
    }
}

function getDerivedStatus(task: any, columnMap: Record<string, any>) {
    const progressPercent = calculateTaskProgress(task, columnMap);

    if (progressPercent === 100) {
        return {
            label: "Completed",
            cls: "text-[var(--status-completed,#15803D)] bg-[var(--status-completed,#15803D)]/10 border-[var(--status-completed,#15803D)]/20",
            dotCls: "bg-[var(--status-completed,#15803D)]"
        };
    }
    if (progressPercent >= 75) {
        return {
            label: "Under Review",
            cls: "text-[var(--status-at-risk,#D97706)] bg-[var(--status-at-risk,#D97706)]/10 border-[var(--status-at-risk,#D97706)]/20",
            dotCls: "bg-[var(--status-at-risk,#D97706)]"
        };
    }
    if (progressPercent >= 25) {
        return {
            label: "In Progress",
            cls: "text-[var(--status-in-progress,#7C3AED)] bg-[var(--status-in-progress,#7C3AED)]/10 border-[var(--status-in-progress,#7C3AED)]/20",
            dotCls: "bg-[var(--status-in-progress,#7C3AED)]"
        };
    }

    const col = columnMap[task.columnId];
    return {
        label: col?.name || "To Do",
        cls: "text-[var(--status-todo,#6B7280)] bg-[var(--app-bg)] border-[var(--app-border)]",
        dotCls: "bg-[var(--status-todo,#6B7280)]"
    };
}

function MainTaskGridCard({
    task,
    projectId,
    columnMap,
    canManageTasks,
    onEditTask,
    onViewDetails,
    onUpdatePriority,
    isSelected = false,
    onToggleSelect,
}: {
    task: any;
    projectId: string;
    columnMap: Record<string, any>;
    canManageTasks: boolean;
    onEditTask: (task: any) => void;
    onViewDetails: (task: any) => void;
    onUpdatePriority?: (taskId: string, newPriority: string) => Promise<void> | void;
    isSelected?: boolean;
    onToggleSelect?: (taskId: string) => void;
}) {
    const { openMemberProfile } = useWorkspace();
    const router = useRouter();
    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter((s: any) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;
    const totalSubtasks = subtasks.length;
    const progressPercent = calculateTaskProgress(task, columnMap);

    const isCompleted = progressPercent === 100 || Boolean(task.isCompleted || task.status === "Completed" || task.status === "Done");
    const priorityDetails = getPriorityDetails(task.priority);
    const statusConfig = getDerivedStatus(task, columnMap);
    const riskBadge = isCompleted ? null : getRiskBadge(task.riskLevel);
    const column = columnMap[task.columnId];

    // Dynamic title typography scaling
    const titleLength = (task.title || "").length;
    const titleSizeClass = titleLength <= 24
        ? "text-[18.5px] sm:text-[20px]"
        : titleLength <= 45
        ? "text-[16.5px] sm:text-[17.5px]"
        : "text-[15px] sm:text-[16px]";

    // Normalize assignees list
    const assigneesList: any[] = [];
    if (Array.isArray(task.assignees)) {
        task.assignees.forEach((a: any) => {
            if (a.user) assigneesList.push(a.user);
            else assigneesList.push(a);
        });
    }

    const dateRange = task.startDate && task.dueDate
        ? `${new Date(task.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : task.dueDate
        ? `Due ${new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : task.startDate
        ? `Starts ${new Date(task.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : null;

    const durationDays = task.startDate && task.dueDate ? calculateDaySpan(task.startDate, task.dueDate) : null;

    return (
        <div
            className={`group relative bg-[var(--app-card)] border ${isSelected ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30" : "border-[var(--app-border)]"} ${priorityDetails.accentBorder} hover:border-[var(--app-border-strong)] rounded-[3px] p-5 flex flex-col justify-between gap-4.5 transition-all duration-200 cursor-pointer shadow-subtle hover:shadow-float corner-brackets`}
            onClick={() => onViewDetails(task)}
        >
            {/* Selection checkbox — top-left, only visible on hover or when selected */}
            {canManageTasks && onToggleSelect && (
                <div
                    className={`absolute top-3 left-3 z-10 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(task.id)}
                        className="cursor-pointer rounded border-[var(--app-border)] w-3.5 h-3.5 accent-[var(--color-accent)]"
                        title={isSelected ? "Deselect task" : "Select task"}
                    />
                </div>
            )}
            <div className="flex flex-col gap-3">
                {/* Card Header: Title & Edit Button */}
                <div className="flex items-start justify-between gap-2.5">
                    <h3 className={`font-heading ${titleSizeClass} font-bold text-[var(--app-text)] tracking-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 leading-snug flex-1 min-w-0`} title={task.title}>
                        {task.title}
                    </h3>
                    {canManageTasks && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                            }}
                            title="Edit Main Task"
                            className="p-1.5 -mt-1 -mr-1 rounded-[2px] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent hover:border-[var(--app-border)] transition-colors cursor-pointer shrink-0"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Tags & Badges Row (Below Title): Show ONLY the necessary badge(s) */}
                <div className="flex items-center gap-2 flex-wrap">
                    {isCompleted ? (
                        /* When Completed: show ONLY the Completed status badge */
                        <span className={`text-[11.5px] font-medium px-2.5 py-0.5 rounded-[2px] border flex items-center gap-1.5 shrink-0 ${statusConfig.cls}`}>
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dotCls}`} />
                            <span>{statusConfig.label}</span>
                        </span>
                    ) : (
                        <>
                            {/* Priority Badge */}
                            <PrioritySelectBadge
                                priority={task.priority}
                                canEdit={canManageTasks}
                                size="sm"
                                onUpdate={onUpdatePriority ? (newP) => onUpdatePriority(task.id, newP) : undefined}
                            />

                            {/* Risk Badge (Overdue / At Risk) OR Status Badge */}
                            {riskBadge ? (
                                <span className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-[2px] border shrink-0 ${riskBadge.cls}`}>
                                    {riskBadge.label}
                                </span>
                            ) : (
                                statusConfig.label && (
                                    <span className={`text-[11.5px] font-medium px-2.5 py-0.5 rounded-[2px] border flex items-center gap-1.5 shrink-0 ${statusConfig.cls}`}>
                                        <span className={`w-2 h-2 rounded-full ${statusConfig.dotCls}`} />
                                        <span>{statusConfig.label}</span>
                                    </span>
                                )
                            )}

                            {/* Folder Badge */}
                            {task.folder && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-[2px] bg-[var(--app-hover-bg)] text-[var(--app-muted)] border border-[var(--app-border)] flex items-center gap-1 shrink-0" title={`Folder: ${task.folder.name}`}>
                                    <span>{task.folder.emoji || "📁"}</span>
                                    <span className="truncate max-w-[110px]">{task.folder.name}</span>
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Task Duration Days & Start/End Dates (Above Progress Section) */}
            {dateRange && (
                <div
                    className="flex items-center gap-1.5 text-xs text-[var(--app-muted)] pt-0.5"
                    title={task.startDate && task.dueDate ? `Timeline: ${dateRange} (${formatDaySpan(durationDays || 0)})` : (task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : "Schedule")}
                >
                    <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />
                    <span>{dateRange}</span>
                    {durationDays && (
                        <span className="font-semibold text-[var(--app-text)] ml-0.5 tabular-nums">
                            • {durationDays}d
                        </span>
                    )}
                </div>
            )}

            {/* Subtask Breakdown / Checklist Tracker */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
                    <span className="flex items-center gap-1.5 font-medium">
                        <CheckSquare className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        <span>Subtasks</span>
                    </span>
                    <span className="font-medium tabular-nums text-xs">
                        {totalSubtasks > 0 
                            ? `${doneSubtasks}/${totalSubtasks} (${progressPercent}%)` 
                            : (task.isCompleted ? "Completed" : "0 subtasks")}
                    </span>
                </div>

                {/* Subtask Progress Track: Slim & Subtle */}
                <div className="w-full bg-[var(--app-border)]/50 h-[3px] rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 rounded-full ${
                            progressPercent === 100
                                ? "bg-[var(--color-success)]/80"
                                : progressPercent > 0
                                ? "bg-[var(--app-text)]/50"
                                : "bg-transparent"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Footer Row: Avatars & Action Buttons (View Details & Open) */}
            <div className="flex items-center justify-between pt-3.5 border-t border-[var(--app-border)] gap-2.5">
                {/* Left: Assignees Stack */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex -space-x-1.5 shrink-0">
                        {assigneesList.length > 0 ? (
                            assigneesList.slice(0, 3).map((user, idx) => {
                                const name = user.name || user.fullName || "User";
                                const avatarUrl = user.avatarUrl || user.user?.avatarUrl;
                                return (
                                    <div 
                                        key={user.id || idx} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openMemberProfile(user);
                                        }}
                                        className="relative ring-2 ring-[var(--app-card)] rounded-full hover:scale-110 hover:z-20 transition-transform shadow-xs shrink-0 cursor-pointer"
                                    >
                                        <UserAvatar
                                            name={name}
                                            avatarUrl={avatarUrl}
                                            size="sm"
                                            title={name}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openMemberProfile(user);
                                            }}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <span className="text-xs text-[var(--app-muted)] italic">Unassigned</span>
                        )}
                        {assigneesList.length > 3 && (
                            <div className="w-5 h-5 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center text-[8.5px] font-semibold text-[var(--app-muted)] shrink-0">
                                +{assigneesList.length - 3}
                            </div>
                        )}
                    </div>
                    {assigneesList.length === 1 && (
                        <span 
                            onClick={(e) => {
                                e.stopPropagation();
                                openMemberProfile(assigneesList[0]);
                            }}
                            className="text-xs text-[var(--app-muted)] truncate max-w-[110px] cursor-pointer hover:underline hover:text-[var(--app-text)]"
                        >
                            {assigneesList[0].name || assigneesList[0].fullName}
                        </span>
                    )}
                </div>

                {/* Right: View Details & Open Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(task);
                        }}
                        icon={<Info className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />}
                        className="!h-[32px] !px-2.5 !text-xs font-semibold text-nowrap whitespace-nowrap shadow-3xs"
                        title="View task description and full details"
                    >
                        View Details
                    </Button>

                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${projectId}/tasks/${task.id}`);
                        }}
                        icon={<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />}
                        className="!h-[32px] !px-2.5 !text-xs font-semibold text-nowrap whitespace-nowrap shadow-3xs"
                        title="Open task board and view subtasks"
                    >
                        Open
                    </Button>
                </div>
            </div>
        </div>
    );
}

function MainTaskListItem({
    index,
    task,
    projectId,
    columnMap,
    canManageTasks,
    onEditTask,
    onViewDetails,
    isSelected = false,
    onToggleSelect,
    canSelect = true,
    onUpdatePriority,
}: {
    index: number;
    task: any;
    projectId: string;
    columnMap: Record<string, any>;
    canManageTasks: boolean;
    onEditTask: (task: any) => void;
    onViewDetails: (task: any) => void;
    isSelected?: boolean;
    onToggleSelect?: (taskId: string) => void;
    canSelect?: boolean;
    onUpdatePriority?: (taskId: string, newPriority: string) => Promise<void> | void;
}) {
    const { openMemberProfile } = useWorkspace();
    const router = useRouter();
    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter((s: any) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;
    const totalSubtasks = subtasks.length;
    const progressPercent = calculateTaskProgress(task, columnMap);

    const isCompleted = progressPercent === 100 || Boolean(task.isCompleted || task.status === "Completed" || task.status === "Done");
    const priorityDetails = getPriorityDetails(task.priority);
    const statusConfig = getDerivedStatus(task, columnMap);
    const riskBadge = isCompleted ? null : getRiskBadge(task.riskLevel);
    const column = columnMap[task.columnId];
    const cleanDescription = stripHtml(task.description || "");

    const assigneesList: any[] = [];
    if (Array.isArray(task.assignees)) {
        task.assignees.forEach((a: any) => {
            if (a.user) assigneesList.push(a.user);
            else assigneesList.push(a);
        });
    }

    return (
        <tr
            className={`group border-b border-[var(--app-border)] transition-colors cursor-pointer text-xs ${
                isSelected
                    ? "bg-[var(--color-accent)]/8 hover:bg-[var(--color-accent)]/12"
                    : "hover:bg-[var(--app-hover-bg)]"
            }`}
            onClick={() => onViewDetails(task)}
        >
            {/* Checkbox */}
            {canSelect && (
                <td
                    className="py-3.5 px-3 text-center whitespace-nowrap w-10"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect && onToggleSelect(task.id)}
                        className="cursor-pointer rounded border-[var(--app-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] w-3.5 h-3.5 accent-[var(--color-accent)]"
                    />
                </td>
            )}

            {/* Serial Number */}
            <td className="py-3.5 px-3 text-center whitespace-nowrap text-[var(--app-muted)] text-[12px] font-medium w-12">
                {index}
            </td>

            {/* Task Title & Description */}
            <td className="py-3.5 px-4 min-w-[240px]">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/projects/${projectId}/tasks/${task.id}`);
                            }}
                            className="font-semibold text-[14px] text-[var(--app-text)] hover:text-[var(--color-accent)] hover:underline transition-colors line-clamp-1 cursor-pointer"
                            title="Open subtask board"
                        >
                            {task.title}
                        </span>
                    </div>
                    {cleanDescription && (
                        <span className="text-[11.5px] text-[var(--app-muted)] line-clamp-1 max-w-[320px]">{cleanDescription}</span>
                    )}
                </div>
            </td>

            {/* Status */}
            <td className="py-3.5 px-4 whitespace-nowrap">
                <span className="text-xs font-medium text-[var(--app-text)]">
                    {statusConfig.label}
                </span>
            </td>

            {/* Priority & Risk */}
            <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    {!isCompleted ? (
                        <>
                            <PrioritySelectBadge
                                priority={task.priority}
                                canEdit={canManageTasks}
                                size="sm"
                                onUpdate={onUpdatePriority ? (newP) => onUpdatePriority(task.id, newP) : undefined}
                            />
                            {riskBadge && (
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border ${riskBadge.cls}`}>
                                    {riskBadge.label}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-[var(--status-completed,#15803D)] font-semibold">Done</span>
                    )}
                </div>
            </td>

            {/* Assignees Members */}
            <td className="py-3.5 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <div className={`flex items-center ${assigneesList.length > 1 ? "-space-x-2" : ""}`}>
                        {assigneesList.length > 0 ? (
                            assigneesList.slice(0, 3).map((user, idx) => {
                                const name = user.name || user.fullName || "User";
                                const avatarUrl = user.avatarUrl || user.user?.avatarUrl;
                                const isMultiple = assigneesList.length > 1;
                                return (
                                    <div
                                        key={user.id || idx}
                                        className={isMultiple ? "relative ring-2 ring-[var(--app-card)] rounded-full hover:scale-110 hover:z-20 transition-transform cursor-pointer shrink-0" : "shrink-0 cursor-pointer"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openMemberProfile(user);
                                        }}
                                    >
                                        <UserAvatar
                                            name={name}
                                            avatarUrl={avatarUrl}
                                            size={isMultiple ? "md" : "sm"}
                                            title={name}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <span className="text-[10px] text-[var(--app-muted)] italic">Unassigned</span>
                        )}
                        {assigneesList.length > 3 && (
                            <div className={`rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center font-semibold text-[var(--app-muted)] shrink-0 ring-2 ring-[var(--app-card)] ${assigneesList.length > 1 ? "w-6 h-6 text-[9px]" : "w-5 h-5 text-[8px]"}`}>
                                +{assigneesList.length - 3}
                            </div>
                        )}
                    </div>
                    {assigneesList.length === 1 && (
                        <span 
                            onClick={(e) => {
                                e.stopPropagation();
                                openMemberProfile(assigneesList[0]);
                            }}
                            className="text-[11.5px] text-[var(--app-text)] font-medium truncate max-w-[110px] cursor-pointer hover:underline"
                        >
                            {assigneesList[0].name || assigneesList[0].fullName}
                        </span>
                    )}
                </div>
            </td>

            {/* Due Date & Span */}
            <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[var(--app-muted)]">
                {task.dueDate ? (
                    <div
                        className="flex items-center gap-1.5 w-fit"
                        title={task.startDate ? `Timeline: ${new Date(task.startDate).toLocaleDateString()} – ${new Date(task.dueDate).toLocaleDateString()} (${formatDaySpan(calculateDaySpan(task.startDate, task.dueDate))})` : `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    >
                        <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        {task.startDate && (
                            <span className="font-medium text-[var(--app-text)] ml-0.5">
                                • {calculateDaySpan(task.startDate, task.dueDate)}d
                            </span>
                        )}
                    </div>
                ) : (
                    <span>—</span>
                )}
            </td>

            {/* Subtask Progress */}
            <td className="py-3.5 px-4 min-w-[150px]">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
                        <span className="tabular-nums text-[11px]">
                            {totalSubtasks > 0 ? `${doneSubtasks}/${totalSubtasks}` : "0 subtasks"}
                        </span>
                        <span className="font-medium tabular-nums text-[11px]">
                            {progressPercent}%
                        </span>
                    </div>
                    <div className="w-full bg-[var(--app-border)]/50 h-[3px] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 rounded-full ${
                                progressPercent === 100
                                    ? "bg-[var(--color-success)]/80"
                                    : progressPercent > 0
                                    ? "bg-[var(--app-text)]/50"
                                    : "bg-transparent"
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </td>

            {/* Actions */}
            <td className="py-3 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                    {canManageTasks && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                            }}
                            title="Edit Main Task"
                            className="p-1 rounded-[2px] hover:bg-[var(--app-card)] text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent hover:border-[var(--app-border)] transition-colors cursor-pointer"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(task);
                        }}
                        icon={<Info className="w-3 h-3 text-[var(--color-accent)]" />}
                        className="!h-[28px] !px-2 !text-[11px] font-semibold text-nowrap whitespace-nowrap shadow-3xs"
                        title="View details"
                    >
                        View Details
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${projectId}/tasks/${task.id}`);
                        }}
                        icon={<ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />}
                        className="!h-[28px] !px-2.5 !text-[11px] font-semibold text-nowrap whitespace-nowrap shadow-3xs"
                        title="Open subtask board"
                    >
                        Open
                    </Button>
                </div>
            </td>
        </tr>
    );
}

interface ProjectBoardViewProps {
    project: any;
    onRefresh?: (silent?: boolean) => void;
    statusFilter?: string;
    onStatusFilterChange?: (status: string) => void;
}

export default function ProjectBoardView({
    project,
    onRefresh,
    statusFilter,
    onStatusFilterChange,
}: ProjectBoardViewProps) {
    const router = useRouter();
    const { currentUser, userRole, currentTeam } = useWorkspace();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
    const [localStatusFilter, setLocalStatusFilter] = useState<string>("ALL");
    const selectedStatus = statusFilter !== undefined ? statusFilter : localStatusFilter;

    const taskFolders = project?.taskFolders || [];
    const [isManageFoldersOpen, setIsManageFoldersOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<string>("ALL");

    const handleStatusChange = (val: string) => {
        setLocalStatusFilter(val);
        if (onStatusFilterChange) {
            onStatusFilterChange(val);
        }
    };

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [groupBy, setGroupBy] = useState<"none" | "priority" | "status" | "folder">(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("project_main_tasks_group_by");
                if (saved === "priority" || saved === "status" || saved === "folder" || saved === "none") {
                    return saved;
                }
            } catch (e) {}
        }
        return taskFolders.length > 0 ? "folder" : "none";
    });

    const handleGroupByChange = (val: "none" | "priority" | "status" | "folder") => {
        setGroupBy(val);
        try {
            localStorage.setItem("project_main_tasks_group_by", val);
        } catch (e) {}
    };

    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const toggleGroupCollapse = (groupKey: string) => {
        setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [isMoveTasksModalOpen, setIsMoveTasksModalOpen] = useState(false);
    const [isBulkDateModalOpen, setIsBulkDateModalOpen] = useState(false);

    const handleToggleTaskSelect = (taskId: string) => {
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    const handleToggleSelectAll = () => {
        if (filteredTasks.length === 0) return;
        const allSelected = filteredTasks.every((t: any) => selectedTaskIds.has(t.id));
        if (allSelected) {
            setSelectedTaskIds(new Set());
        } else {
            const next = new Set<string>();
            filteredTasks.forEach((t: any) => next.add(t.id));
            setSelectedTaskIds(next);
        }
    };

    const handleToggleSelectGroupTasks = (groupTasks: any[]) => {
        if (!groupTasks || groupTasks.length === 0) return;
        const allGroupSelected = groupTasks.every((t: any) => selectedTaskIds.has(t.id));
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            if (allGroupSelected) {
                groupTasks.forEach((t: any) => next.delete(t.id));
            } else {
                groupTasks.forEach((t: any) => next.add(t.id));
            }
            return next;
        });
    };

    const handleBulkMoveTasks = async (targetFolderId: string | null) => {
        const taskIds = Array.from(selectedTaskIds);
        if (taskIds.length === 0) return;

        try {
            await api.updateProjectTask(project.id, {
                taskIds,
                folderId: targetFolderId,
            });
            const targetFolder = taskFolders.find((f: any) => f.id === targetFolderId);
            const folderName = targetFolder ? `${targetFolder.emoji || "📁"} ${targetFolder.name}` : "Common Space";
            toast.success(`Moved ${taskIds.length} ${taskIds.length === 1 ? "task" : "tasks"} to ${folderName}`);
            setSelectedTaskIds(new Set());
            if (onRefresh) {
                onRefresh(true);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to move tasks");
            throw err;
        }
    };

    const handleBulkUpdateDates = async (data: { startDate?: string; dueDate?: string; assigneeIds?: string[]; assignMode?: "assign" | "unassign" }) => {
        const taskIds = Array.from(selectedTaskIds);
        if (taskIds.length === 0) return;

        try {
            await api.updateProjectTask(project.id, { taskIds, ...data });

            // Build a readable success message
            if (data.assigneeIds && data.assigneeIds.length > 0) {
                const verb = data.assignMode === "unassign" ? "Unassigned" : "Assigned";
                const people = `${data.assigneeIds.length} ${data.assigneeIds.length === 1 ? "person" : "people"}`;
                const tasks = `${taskIds.length} ${taskIds.length === 1 ? "task" : "tasks"}`;
                const prep = data.assignMode === "unassign" ? "from" : "to";
                toast.success(`${verb} ${people} ${prep} ${tasks}`);
            } else {
                const parts: string[] = [];
                if (data.startDate) parts.push(`start → ${new Date(data.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`);
                if (data.dueDate) parts.push(`due → ${new Date(data.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`);
                toast.success(`Updated ${taskIds.length} ${taskIds.length === 1 ? "task" : "tasks"}: ${parts.join(", ")}`);
            }

            setSelectedTaskIds(new Set());
            if (onRefresh) onRefresh(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to update tasks");
            throw err;
        }
    };

    const handleUpdateTaskPriority = async (taskId: string, newPriority: string) => {
        try {
            await api.updateProjectTask(project.id, taskId, { priority: newPriority });
            toast.success(`Priority updated to ${newPriority.toLowerCase()}`);
            if (onRefresh) onRefresh(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to update priority");
            throw err;
        }
    };

    const [filterMode, setFilterMode] = useState<"all" | "my-tasks">("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("project_main_tasks_view_mode");
                if (saved === "list" || saved === "grid") {
                    return saved;
                }
            } catch (e) {}
        }
        return "grid";
    });
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [selectedDetailTask, setSelectedDetailTask] = useState<any | null>(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

    const projectStartDate = extractDateString(project?.startDate);
    const projectEndDate = extractDateString(project?.endDate);
    const todayStr = getLocalDateString(new Date());

    const [dateFilterMode, setDateFilterMode] = useState<"all" | "range">("all");
    const [rangeStartDate, setRangeStartDate] = useState<string>(() => projectStartDate || todayStr);
    const [rangeEndDate, setRangeEndDate] = useState<string>(() => projectEndDate || todayStr);

    useEffect(() => {
        if (projectStartDate && !rangeStartDate) {
            setRangeStartDate(projectStartDate);
        }
        if (projectEndDate && !rangeEndDate) {
            setRangeEndDate(projectEndDate);
        }
    }, [projectStartDate, projectEndDate, rangeStartDate, rangeEndDate]);

    const isTaskActiveInRange = (task: any, startRange: string, endRange: string) => {
        if (!startRange && !endRange) return true;
        const taskStart = extractDateString(task.startDate);
        const taskDue = extractDateString(task.dueDate);

        // If both start and due date are set: task spans between startDate and dueDate
        if (taskStart && taskDue) {
            if (startRange && endRange) {
                return taskStart <= endRange && taskDue >= startRange;
            }
            if (startRange) return taskDue >= startRange;
            if (endRange) return taskStart <= endRange;
        }
        // If only due date is set
        if (taskDue) {
            if (startRange && endRange) {
                return taskDue >= startRange && taskDue <= endRange;
            }
            if (startRange) return taskDue >= startRange;
            if (endRange) return taskDue <= endRange;
        }
        // If only start date is set
        if (taskStart) {
            if (startRange && endRange) {
                return taskStart >= startRange && taskStart <= endRange;
            }
            if (startRange) return taskStart >= startRange;
            if (endRange) return taskStart <= endRange;
        }
        // If no dates specified on task, show it
        return true;
    };

    const handleSetRangePreset = (preset: "project" | "month" | "30days" | "week") => {
        const today = new Date();
        const todayFormatted = getLocalDateString(today);

        if (preset === "project") {
            setRangeStartDate(projectStartDate || todayFormatted);
            setRangeEndDate(projectEndDate || todayFormatted);
        } else if (preset === "month") {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setRangeStartDate(getLocalDateString(firstDay));
            setRangeEndDate(getLocalDateString(lastDay));
        } else if (preset === "30days") {
            const next30 = new Date(today);
            next30.setDate(today.getDate() + 29);
            setRangeStartDate(todayFormatted);
            setRangeEndDate(getLocalDateString(next30));
        } else if (preset === "week") {
            const currentDay = today.getDay();
            const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            setRangeStartDate(getLocalDateString(monday));
            setRangeEndDate(getLocalDateString(sunday));
        }
    };

    const handleViewModeChange = (mode: "grid" | "list") => {
        setViewMode(mode);
        try {
            localStorage.setItem("project_main_tasks_view_mode", mode);
        } catch (e) {}
    };

    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const canManageTasks = permissions.canManageTasks;

    const tasks = project?.tasks || [];
    const columns = project?.columns || [];

    // Map column ID to column object
    const columnMap: Record<string, any> = {};
    columns.forEach((col: any) => {
        columnMap[col.id] = col;
    });

    const statusOptions: SelectOption[] = React.useMemo(() => {
        const base: SelectOption[] = [...STATUS_OPTIONS];
        if (columns && columns.length > 0) {
            columns.forEach((col: any) => {
                const exists = base.some(
                    (b) =>
                        b.label.toLowerCase() === col.name?.toLowerCase() ||
                        b.value.toLowerCase() === col.id?.toLowerCase() ||
                        b.value.toLowerCase() === col.type?.toLowerCase()
                );
                if (!exists && col.name) {
                    base.push({ value: col.id, label: col.name });
                }
            });
        }
        return base;
    }, [columns]);

    // Count tasks assigned to current user
    const myTasksCount = tasks.filter((t: any) => {
        const isMainAssignee =
            Array.isArray(t.assignees) &&
            t.assignees.some((a: any) => (a.userId || a.user?.id || a.id) === currentUser?.id);
        const isSubtaskAssignee =
            Array.isArray(t.subtasks) &&
            t.subtasks.some((st: any) => (st.assignedToId || st.assignedTo?.id) === currentUser?.id);
        return isMainAssignee || isSubtaskAssignee;
    }).length;

    // Filter tasks based on search, priority, status, date, and assignment
    const filteredTasks = tasks.filter((t: any) => {
        const matchesSearch =
            searchQuery === "" ||
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPriority =
            selectedPriority === "ALL" || (t.priority || "").toUpperCase() === selectedPriority;

        const matchesStatus =
            selectedStatus === "ALL" ||
            (() => {
                const sc = getDerivedStatus(t, columnMap);
                const sUpper = selectedStatus.toUpperCase();
                if (sUpper === "COMPLETED" || sUpper === "DONE") {
                    return (
                        sc.label === "Completed" ||
                        t.isCompleted ||
                        Boolean(columnMap[t.columnId]?.isComplete)
                    );
                }
                if (sUpper === "IN_PROGRESS" || sUpper === "PROGRESS") {
                    return sc.label === "In Progress" || columnMap[t.columnId]?.type === "IN_PROGRESS";
                }
                if (sUpper === "UNDER_REVIEW" || sUpper === "REVIEW") {
                    return sc.label === "Under Review" || columnMap[t.columnId]?.type === "NEED_ATTENTION";
                }
                if (sUpper === "TODO" || sUpper === "TO_DO") {
                    return (
                        sc.label === "To Do" ||
                        columnMap[t.columnId]?.type === "TODO" ||
                        columnMap[t.columnId]?.type === "BACKLOG"
                    );
                }
                return (
                    t.columnId === selectedStatus ||
                    (columnMap[t.columnId]?.name?.toLowerCase() === selectedStatus.toLowerCase())
                );
            })();

        const isAssignedToMe =
            (Array.isArray(t.assignees) &&
                t.assignees.some((a: any) => (a.userId || a.user?.id || a.id) === currentUser?.id)) ||
            (Array.isArray(t.subtasks) &&
                t.subtasks.some((st: any) => (st.assignedToId || st.assignedTo?.id) === currentUser?.id));

        const matchesFilterMode = filterMode === "all" || isAssignedToMe;
        const matchesDate =
            dateFilterMode === "all" ||
            (dateFilterMode === "range" && isTaskActiveInRange(t, rangeStartDate, rangeEndDate));

        const matchesFolder =
            selectedFolder === "ALL"
                ? true
                : selectedFolder === "COMMON"
                ? !t.folderId && !t.folder?.id
                : t.folderId === selectedFolder || t.folder?.id === selectedFolder;

        return matchesSearch && matchesPriority && matchesStatus && matchesFilterMode && matchesDate && matchesFolder;
    });

    const activeFilterCount =
        (dateFilterMode !== "all" ? 1 : 0) +
        (selectedPriority !== "ALL" ? 1 : 0) +
        (selectedStatus !== "ALL" ? 1 : 0) +
        (selectedFolder !== "ALL" ? 1 : 0) +
        (filterMode !== "all" ? 1 : 0) +
        (searchQuery.trim() !== "" ? 1 : 0);

    const handleClearAllFilters = () => {
        setDateFilterMode("all");
        setSelectedPriority("ALL");
        handleStatusChange("ALL");
        setSelectedFolder("ALL");
        setFilterMode("all");
        setSearchQuery("");
    };

    interface TaskGroup {
        key: string;
        title: string;
        dotCls: string;
        emoji?: string;
        tasks: any[];
    }

    const groupedTaskSections: TaskGroup[] = React.useMemo(() => {
        if (groupBy === "none") return [];

        if (groupBy === "folder") {
            const groups: TaskGroup[] = [];

            // Add each folder that has at least one task
            taskFolders.forEach((folder: any) => {
                const folderTasks = filteredTasks.filter(
                    (t: any) => t.folderId === folder.id || t.folder?.id === folder.id
                );
                if (folderTasks.length > 0) {
                    groups.push({
                        key: `folder-${folder.id}`,
                        title: folder.name,
                        dotCls: "bg-[var(--app-primary,#3B82F6)]",
                        emoji: folder.emoji || "📁",
                        tasks: folderTasks,
                    });
                }
            });

            return groups;
        }

        if (groupBy === "priority") {
            const priorityOrder = [
                { key: "URGENT", title: "Urgent Priority", dotCls: "bg-[var(--priority-urgent,#CB2431)]" },
                { key: "HIGH", title: "High Priority", dotCls: "bg-[var(--priority-high,#EA580C)]" },
                { key: "MEDIUM", title: "Medium Priority", dotCls: "bg-[var(--priority-medium,#CA8A04)]" },
                { key: "LOW", title: "Low Priority", dotCls: "bg-[var(--priority-low,#6B7280)]" },
            ];
            const groups: TaskGroup[] = priorityOrder.map((p) => ({
                key: p.key,
                title: p.title,
                dotCls: p.dotCls,
                tasks: filteredTasks.filter(
                    (t: any) => (t.priority || "LOW").toUpperCase() === p.key
                ),
            }));
            return groups.filter((g) => g.tasks.length > 0);
        }

        if (groupBy === "status") {
            const statusOrder = [
                { key: "TODO", title: "To Do", dotCls: "bg-[var(--app-muted)]" },
                { key: "IN_PROGRESS", title: "In Progress", dotCls: "bg-[var(--status-in-progress,#7C3AED)]" },
                { key: "UNDER_REVIEW", title: "Under Review", dotCls: "bg-[var(--status-at-risk,#D97706)]" },
                { key: "COMPLETED", title: "Completed", dotCls: "bg-[var(--status-completed,#15803D)]" },
            ];
            const groups: TaskGroup[] = statusOrder.map((s) => ({
                key: s.key,
                title: s.title,
                dotCls: s.dotCls,
                tasks: filteredTasks.filter((t: any) => {
                    const sc = getDerivedStatus(t, columnMap);
                    if (s.key === "COMPLETED") {
                        return (
                            sc.label === "Completed" ||
                            t.isCompleted ||
                            Boolean(columnMap[t.columnId]?.isComplete)
                        );
                    }
                    if (s.key === "UNDER_REVIEW") return sc.label === "Under Review";
                    if (s.key === "IN_PROGRESS") return sc.label === "In Progress";
                    return (
                        sc.label === "To Do" ||
                        (!t.isCompleted &&
                            sc.label !== "Completed" &&
                            sc.label !== "Under Review" &&
                            sc.label !== "In Progress")
                    );
                }),
            }));
            return groups.filter((g) => g.tasks.length > 0);
        }

        return [];
    }, [groupBy, filteredTasks, columnMap, taskFolders]);

    const unfolderedTasks = React.useMemo(() => {
        return filteredTasks.filter((t: any) => !t.folderId && !t.folder?.id);
    }, [filteredTasks]);

    const isAllSelected =
        filteredTasks.length > 0 && filteredTasks.every((t: any) => selectedTaskIds.has(t.id));
    const isSomeSelected =
        filteredTasks.some((t: any) => selectedTaskIds.has(t.id)) && !isAllSelected;

    const handleOpenEditTask = (taskToEdit: any) => {
        setEditingTask(taskToEdit);
        setIsEditTaskModalOpen(true);
    };

    const handleOpenTaskDetail = (taskToDetail: any) => {
        setSelectedDetailTask(taskToDetail);
        setIsDetailDrawerOpen(true);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)]">
            {/* Header Toolbar */}
            <div className="shrink-0 px-5 py-2.5 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-wrap items-center justify-between gap-3 select-none">
                {/* Left Side: Add Main Task Button (At the very beginning!) + Scope Segmented Toggle */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {/* Add Main Task Action Button (First) */}
                    {canManageTasks && (
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setIsCreateTaskModalOpen(true)}
                        >
                            Add Main Task
                        </Button>
                    )}

                    {/* Folders Button */}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Folder className="w-3.5 h-3.5 text-[var(--app-muted)]" />}
                        onClick={() => setIsManageFoldersOpen(true)}
                        className="font-medium h-[32px] px-2.5"
                        title="Manage task folders"
                    >
                        <span>Folders</span>
                        {taskFolders.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--app-card)] border border-[var(--app-border)] font-semibold tabular-nums text-[var(--app-muted)]">
                                {taskFolders.length}
                            </span>
                        )}
                    </Button>

                    {/* Scope Segmented Toggle */}
                    <div className="flex items-center h-[32px] bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-xs font-medium shrink-0">
                        <button
                            type="button"
                            onClick={() => setFilterMode("all")}
                            className={`h-full px-3 rounded-[1px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                filterMode === "all"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <span>All Tasks</span>
                            <span className={`text-xs tabular-nums font-normal transition-colors ${
                                filterMode === "all" ? "text-[var(--app-muted)]" : "text-[var(--app-muted)]/70"
                            }`}>
                                ({tasks.length})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode("my-tasks")}
                            className={`h-full px-3 rounded-[1px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                filterMode === "my-tasks"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <User className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            <span>My Tasks</span>
                            {myTasksCount > 0 && (
                                <span className={`text-xs tabular-nums font-normal transition-colors ${
                                    filterMode === "my-tasks" ? "text-[var(--app-muted)]" : "text-[var(--app-muted)]/70"
                                }}`}>
                                    ({myTasksCount})
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Side: Search, Filter Button, Group By Selector, View Switcher */}
                <div className="flex items-center gap-2.5 flex-wrap min-w-0 justify-end ml-auto">
                    {/* Search Input */}
                    <div className="relative w-44 sm:w-56 h-[32px] shrink-0">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search main tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-[32px] bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] focus:border-[var(--app-border-strong)] rounded-[2px] pl-7 pr-3 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none transition-colors corner-brackets-4"
                        />
                    </div>

                    {/* Filter Button next to search bar */}
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`h-[32px] px-2.5 text-xs font-medium border rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                            isFilterOpen || activeFilterCount > 0
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold"
                                : "border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                        }`}
                        title="Toggle filters"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                                {activeFilterCount}
                            </span>
                        )}
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Group By selector */}
                    <CustomSelect
                        options={[
                            { value: "none", label: "Group: None" },
                            ...(taskFolders.length > 0 ? [{ value: "folder", label: "Group: Folder" }] : []),
                            { value: "status", label: "Group: Status" },
                            { value: "priority", label: "Group: Priority" },
                        ]}
                        value={groupBy}
                        onChange={(val) => handleGroupByChange(val as any)}
                        buttonClassName="corner-brackets-4 text-xs h-[32px] !py-0 px-2.5 bg-[var(--app-card)]"
                        className="w-32 sm:w-36 h-[32px] shrink-0"
                    />

                    {/* View Switcher: Far Right */}
                    <div className="flex items-center h-[32px] bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-xs font-medium shrink-0">
                        <button
                            type="button"
                            onClick={() => handleViewModeChange("grid")}
                            className={`h-full p-2 rounded-[1px] transition-colors cursor-pointer flex items-center justify-center ${
                                viewMode === "grid"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                            }`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleViewModeChange("list")}
                            className={`h-full p-2 rounded-[1px] transition-colors cursor-pointer flex items-center justify-center ${
                                viewMode === "list"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                            }`}
                            title="List View"
                        >
                            <List className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible Filter Bar (toggled by Filter button) */}
            {isFilterOpen && (
                <div className="shrink-0 px-5 py-2.5 border-b border-[var(--app-border)] bg-[var(--app-bg)]/80 flex flex-wrap items-center gap-3 animate-fade-in select-none">
                    <span className="text-[11px] font-semibold text-[var(--app-muted)] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                        <SlidersHorizontal className="w-3 h-3 text-[var(--color-accent)]" />
                        Filters:
                    </span>

                    {/* Folder Filter (When folders exist) */}
                    {taskFolders.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-[var(--app-muted)]">Folder:</span>
                            <CustomSelect
                                options={[
                                    { value: "ALL", label: `All Folders (${tasks.length})` },
                                    { value: "COMMON", label: `Common Space (${tasks.filter((t: any) => !t.folderId && !t.folder?.id).length})` },
                                    ...taskFolders.map((f: any) => ({
                                        value: f.id,
                                        label: `${f.emoji || "📁"} ${f.name} (${tasks.filter((t: any) => t.folderId === f.id || t.folder?.id === f.id).length})`,
                                    })),
                                ]}
                                value={selectedFolder}
                                onChange={setSelectedFolder}
                                buttonClassName="corner-brackets-4 text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-card)]"
                                className="w-40 sm:w-48 h-[30px] shrink-0"
                            />
                        </div>
                    )}

                    {/* Status Filter (Functional from backend) */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-[var(--app-muted)]">Status:</span>
                        <CustomSelect
                            options={statusOptions}
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            buttonClassName="corner-brackets-4 text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-card)]"
                            className="w-32 sm:w-36 h-[30px] shrink-0"
                        />
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-[var(--app-muted)]">Priority:</span>
                        <CustomSelect
                            options={PRIORITY_OPTIONS}
                            value={selectedPriority}
                            onChange={setSelectedPriority}
                            buttonClassName="corner-brackets-4 text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-card)]"
                            className="w-32 sm:w-36 h-[30px] shrink-0"
                        />
                    </div>

                    {/* Date Filter: All Dates vs Date Range */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-[var(--app-muted)]">Date:</span>
                        <div className="flex items-center h-[30px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-xs font-medium shrink-0">
                            <button
                                type="button"
                                onClick={() => setDateFilterMode("all")}
                                className={`h-full px-2 rounded-[1px] transition-all cursor-pointer flex items-center justify-center ${
                                    dateFilterMode === "all"
                                        ? "bg-[var(--app-bg)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                            >
                                All Dates
                            </button>
                            <button
                                type="button"
                                onClick={() => setDateFilterMode("range")}
                                className={`h-full px-2 rounded-[1px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    dateFilterMode === "range"
                                        ? "bg-[var(--app-bg)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                            >
                                <CalendarRange className="w-3 h-3 text-[var(--app-muted)]" />
                                <span>Date Range</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Range Selector & Presets */}
                    {dateFilterMode === "range" && (
                        <div className="flex items-center gap-2 shrink-0 animate-fade-in flex-wrap">
                            <div className="flex items-center h-[30px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-1.5 py-0.5 shadow-2xs gap-1">
                                <CustomDatePicker
                                    value={rangeStartDate}
                                    onChange={(val) => {
                                        setRangeStartDate(val);
                                        if (rangeEndDate && val > rangeEndDate) setRangeEndDate(val);
                                    }}
                                    placeholder="Start Date"
                                    minDate={projectStartDate}
                                    maxDate={rangeEndDate && projectEndDate ? (rangeEndDate < projectEndDate ? rangeEndDate : projectEndDate) : (rangeEndDate || projectEndDate || undefined)}
                                    buttonClassName="border-0 shadow-none bg-transparent hover:bg-[var(--app-hover-bg)] h-full py-0 px-2 text-xs font-medium"
                                    className="w-28 h-full flex items-center"
                                />
                                <span className="text-xs text-[var(--app-muted)] font-semibold px-0.5 select-none">→</span>
                                <CustomDatePicker
                                    value={rangeEndDate}
                                    onChange={(val) => {
                                        setRangeEndDate(val);
                                        if (rangeStartDate && val < rangeStartDate) setRangeStartDate(val);
                                    }}
                                    placeholder="End Date"
                                    minDate={rangeStartDate && projectStartDate ? (rangeStartDate > projectStartDate ? rangeStartDate : projectStartDate) : (rangeStartDate || projectStartDate || undefined)}
                                    maxDate={projectEndDate}
                                    buttonClassName="border-0 shadow-none bg-transparent hover:bg-[var(--app-hover-bg)] h-full py-0 px-2 text-xs font-medium"
                                    className="w-28 h-full flex items-center"
                                />
                            </div>

                            <div className="hidden lg:flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleSetRangePreset("month")}
                                    className="h-[30px] px-2 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                                >
                                    This Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetRangePreset("30days")}
                                    className="h-[30px] px-2 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                                >
                                    30 Days
                                </button>
                                {projectStartDate && projectEndDate && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetRangePreset("project")}
                                        className="h-[30px] px-2 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                                        title="Reset to Full Project Duration"
                                    >
                                        Project Window
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reset Filters Button */}
                    {activeFilterCount > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<X className="w-3 h-3" />}
                            onClick={handleClearAllFilters}
                            className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 animate-fade-in shrink-0 h-[30px] !text-[11px]"
                            title="Reset all search, status, priority, and date filters"
                        >
                            Reset ({activeFilterCount})
                        </Button>
                    )}
                </div>
            )}

            {/* Content View: Grid or List */}
            <div className="flex-1 overflow-y-auto p-5">
                {filteredTasks.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[var(--app-border)] rounded-[3px] text-center p-6 bg-[var(--app-card)] relative corner-brackets-4">
                        <Layers className="w-8 h-8 text-[var(--app-muted)] mb-2" />
                        <h4 className="text-sm font-semibold text-[var(--app-text)] mb-1">No Main Tasks Found</h4>
                        <p className="text-[11px] text-[var(--app-muted)] max-w-sm mb-4">
                            {searchQuery
                                ? "No tasks matched your search query or filter."
                                : selectedStatus !== "ALL"
                                ? "No tasks matched the selected status filter."
                                : dateFilterMode === "range"
                                ? "No tasks are active within the selected date range."
                                : "Get started by creating your first main task for this project."}
                        </p>
                        <div className="flex items-center gap-2">
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleClearAllFilters}
                                >
                                    Clear Filters
                                </Button>
                            )}
                            {canManageTasks && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus className="w-3.5 h-3.5" />}
                                    onClick={() => setIsCreateTaskModalOpen(true)}
                                >
                                    Create Main Task
                                </Button>
                            )}
                        </div>
                    </div>
                ) : viewMode === "grid" ? (
                    groupBy !== "none" ? (
                        <div className="flex flex-col gap-6">
                            {groupedTaskSections.map((group) => {
                                const isCollapsed = collapsedGroups[group.key];
                                return (
                                    <div key={group.key} className="flex flex-col gap-3">
                                        <div
                                            className="flex items-center justify-between py-2 px-3.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] cursor-pointer select-none hover:bg-[var(--app-hover-bg)] transition-colors"
                                            onClick={() => toggleGroupCollapse(group.key)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <ChevronDown
                                                    className={`w-3.5 h-3.5 text-[var(--app-muted)] transition-transform duration-200 ${
                                                        isCollapsed ? "-rotate-90" : ""
                                                    }`}
                                                />
                                                {group.emoji ? (
                                                    <span className="text-sm select-none shrink-0">{group.emoji}</span>
                                                ) : (
                                                    <span className={`w-2 h-2 rounded-full ${group.dotCls}`} />
                                                )}
                                                <span className="text-xs font-bold text-[var(--app-text)]">{group.title}</span>
                                                <span className="px-2 py-0.5 rounded-[2px] text-[10px] bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)] font-medium tabular-nums">
                                                    {group.tasks.length}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-[var(--app-muted)]">
                                                {isCollapsed ? "Expand" : "Collapse"}
                                            </span>
                                        </div>
                                        {!isCollapsed && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                                                {group.tasks.map((task: any) => (
                                                    <MainTaskGridCard
                                                        key={task.id}
                                                        task={task}
                                                        projectId={project.id}
                                                        columnMap={columnMap}
                                                        canManageTasks={canManageTasks}
                                                        onEditTask={handleOpenEditTask}
                                                        onViewDetails={handleOpenTaskDetail}
                                                        onUpdatePriority={handleUpdateTaskPriority}
                                                        isSelected={selectedTaskIds.has(task.id)}
                                                        onToggleSelect={canManageTasks ? handleToggleTaskSelect : undefined}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Unfoldered tasks in grid view rendered simply below without accordion */}
                            {groupBy === "folder" && unfolderedTasks.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                                    {unfolderedTasks.map((task: any) => (
                                        <MainTaskGridCard
                                            key={task.id}
                                            task={task}
                                            projectId={project.id}
                                            columnMap={columnMap}
                                            canManageTasks={canManageTasks}
                                            onEditTask={handleOpenEditTask}
                                            onViewDetails={handleOpenTaskDetail}
                                            onUpdatePriority={handleUpdateTaskPriority}
                                            isSelected={selectedTaskIds.has(task.id)}
                                            onToggleSelect={canManageTasks ? handleToggleTaskSelect : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                            {filteredTasks.map((task: any) => (
                                <MainTaskGridCard
                                    key={task.id}
                                    task={task}
                                    projectId={project.id}
                                    columnMap={columnMap}
                                    canManageTasks={canManageTasks}
                                    onEditTask={handleOpenEditTask}
                                    onViewDetails={handleOpenTaskDetail}
                                    onUpdatePriority={handleUpdateTaskPriority}
                                    isSelected={selectedTaskIds.has(task.id)}
                                    onToggleSelect={canManageTasks ? handleToggleTaskSelect : undefined}
                                />
                            ))}

                            {/* Add New Task Card */}
                            {canManageTasks && (
                                <button
                                    type="button"
                                    onClick={() => setIsCreateTaskModalOpen(true)}
                                    className="group h-full min-h-[190px] border border-dashed border-[var(--app-border)] hover:border-[var(--color-accent)] bg-[var(--app-card)]/40 hover:bg-[var(--app-hover-bg)] rounded-[3px] p-6 flex flex-col items-center justify-center gap-3 text-[var(--app-muted)] hover:text-[var(--color-accent)] transition-all cursor-pointer relative corner-brackets-4 shadow-3xs"
                                >
                                    <div className="w-10 h-10 rounded-[3px] bg-[var(--app-bg)] group-hover:bg-[var(--color-accent)]/10 border border-[var(--app-border)] group-hover:border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--app-muted)] group-hover:text-[var(--color-accent)] transition-all">
                                        <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    </div>
                                    <span className="text-xs font-semibold tracking-tight">Add New Task</span>
                                </button>
                            )}
                        </div>
                    )
                ) : (
                    /* List / Table View */
                    <div className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-card)] overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[10px] font-medium text-[var(--app-muted)]">
                                        {canManageTasks && (
                                            <th className="py-3 px-3 font-semibold text-center w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = isSomeSelected;
                                                    }}
                                                    onChange={handleToggleSelectAll}
                                                    className="cursor-pointer rounded border-[var(--app-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] w-3.5 h-3.5 accent-[var(--color-accent)]"
                                                    title={isAllSelected ? "Deselect all" : "Select all visible tasks"}
                                                />
                                            </th>
                                        )}
                                        <th className="py-3 px-3 font-semibold text-center w-12">#</th>
                                        <th className="py-3 px-4 font-semibold">Task & Category</th>
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold">Priority</th>
                                        <th className="py-3 px-4 font-semibold">Members</th>
                                        <th className="py-3 px-4 font-semibold">Due Date</th>
                                        <th className="py-3 px-4 font-semibold">Subtasks Progress</th>
                                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupBy !== "none" ? (
                                        <>
                                            {/* Folder accordions (or priority/status accordions) */}
                                            {groupedTaskSections.map((group) => {
                                                const isCollapsed = collapsedGroups[group.key];
                                                const isAllGroupSelected =
                                                    group.tasks.length > 0 &&
                                                    group.tasks.every((t: any) => selectedTaskIds.has(t.id));
                                                const isSomeGroupSelected =
                                                    group.tasks.some((t: any) => selectedTaskIds.has(t.id)) &&
                                                    !isAllGroupSelected;

                                                return (
                                                    <React.Fragment key={group.key}>
                                                        <tr
                                                            className="bg-[var(--app-hover-bg)]/80 hover:bg-[var(--app-hover-bg)] border-y border-[var(--app-border)] cursor-pointer select-none transition-colors"
                                                            onClick={() => toggleGroupCollapse(group.key)}
                                                        >
                                                            <td colSpan={canManageTasks ? 9 : 8} className="py-2.5 px-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2.5">
                                                                        {canManageTasks && (
                                                                            <div
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleToggleSelectGroupTasks(group.tasks);
                                                                                }}
                                                                                className="flex items-center"
                                                                                title="Select all tasks in this folder"
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isAllGroupSelected}
                                                                                    ref={(el) => {
                                                                                        if (el) el.indeterminate = isSomeGroupSelected;
                                                                                    }}
                                                                                    onChange={() => {}}
                                                                                    className="cursor-pointer rounded border-[var(--app-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] w-3.5 h-3.5 accent-[var(--color-accent)]"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        <ChevronDown
                                                                            className={`w-3.5 h-3.5 text-[var(--app-muted)] transition-transform duration-200 ${
                                                                                isCollapsed ? "-rotate-90" : ""
                                                                            }`}
                                                                        />
                                                                        {group.emoji ? (
                                                                            <span className="text-sm select-none shrink-0">{group.emoji}</span>
                                                                        ) : (
                                                                            <span className={`w-2 h-2 rounded-full ${group.dotCls}`} />
                                                                        )}
                                                                        <span className="font-bold text-xs text-[var(--app-text)]">{group.title}</span>
                                                                        <span className="px-1.5 py-0.2 rounded-[2px] text-[10px] bg-[var(--app-card)] text-[var(--app-muted)] border border-[var(--app-border)] font-medium tabular-nums">
                                                                            {group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] text-[var(--app-muted)] font-normal">
                                                                        {isCollapsed ? "Expand folder" : "Collapse folder"}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {!isCollapsed &&
                                                            group.tasks.map((task: any, idx: number) => (
                                                                <MainTaskListItem
                                                                    key={task.id}
                                                                    index={idx + 1}
                                                                    task={task}
                                                                    projectId={project.id}
                                                                    columnMap={columnMap}
                                                                    canManageTasks={canManageTasks}
                                                                    onEditTask={handleOpenEditTask}
                                                                    onViewDetails={handleOpenTaskDetail}
                                                                    isSelected={selectedTaskIds.has(task.id)}
                                                                    onToggleSelect={handleToggleTaskSelect}
                                                                    canSelect={canManageTasks}
                                                                    onUpdatePriority={handleUpdateTaskPriority}
                                                                />
                                                            ))}
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Unfoldered tasks simply below the accordion, NOT inside an accordion */}
                                            {groupBy === "folder" &&
                                                unfolderedTasks.map((task: any, idx: number) => (
                                                    <MainTaskListItem
                                                        key={task.id}
                                                        index={idx + 1}
                                                        task={task}
                                                        projectId={project.id}
                                                        columnMap={columnMap}
                                                        canManageTasks={canManageTasks}
                                                        onEditTask={handleOpenEditTask}
                                                        onViewDetails={handleOpenTaskDetail}
                                                        isSelected={selectedTaskIds.has(task.id)}
                                                        onToggleSelect={handleToggleTaskSelect}
                                                        canSelect={canManageTasks}
                                                        onUpdatePriority={handleUpdateTaskPriority}
                                                    />
                                                ))}
                                        </>
                                    ) : (
                                        filteredTasks.map((task: any, index: number) => (
                                            <MainTaskListItem
                                                key={task.id}
                                                index={index + 1}
                                                task={task}
                                                projectId={project.id}
                                                columnMap={columnMap}
                                                canManageTasks={canManageTasks}
                                                onEditTask={handleOpenEditTask}
                                                onViewDetails={handleOpenTaskDetail}
                                                isSelected={selectedTaskIds.has(task.id)}
                                                onToggleSelect={handleToggleTaskSelect}
                                                canSelect={canManageTasks}
                                                onUpdatePriority={handleUpdateTaskPriority}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Task Detail Side Drawer */}
            <MainTaskDetailDrawer
                isOpen={isDetailDrawerOpen}
                onClose={() => {
                    setIsDetailDrawerOpen(false);
                    setSelectedDetailTask(null);
                }}
                task={selectedDetailTask}
                project={project}
                columnMap={columnMap}
                canEdit={canManageTasks}
                onEditClick={() => {
                    if (selectedDetailTask) {
                        handleOpenEditTask(selectedDetailTask);
                    }
                }}
                onOpenBoard={() => {
                    if (selectedDetailTask) {
                        router.push(`/projects/${project.id}/tasks/${selectedDetailTask.id}`);
                    }
                }}
                onRefresh={onRefresh}
            />

            {/* Create Project Main Task Modal */}
            <CreateProjectTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                project={project}
                onRefresh={onRefresh}
            />

            {/* Update Project Main Task Modal */}
            <UpdateProjectTaskModal
                isOpen={isEditTaskModalOpen}
                onClose={() => {
                    setIsEditTaskModalOpen(false);
                    setEditingTask(null);
                }}
                project={project}
                task={editingTask}
                onRefresh={onRefresh}
            />

            {/* Manage Project Task Folders Drawer */}
            <ManageProjectTaskFoldersDrawer
                isOpen={isManageFoldersOpen}
                onClose={() => setIsManageFoldersOpen(false)}
                projectId={project.id}
                folders={taskFolders}
                canManage={canManageTasks}
                onFoldersUpdated={() => {
                    if (onRefresh) onRefresh(true);
                }}
            />

            {/* Move Tasks to Folder Modal */}
            <MoveTasksToFolderModal
                isOpen={isMoveTasksModalOpen}
                onClose={() => setIsMoveTasksModalOpen(false)}
                taskCount={selectedTaskIds.size}
                folders={taskFolders}
                onMove={handleBulkMoveTasks}
                onOpenManageFolders={() => setIsManageFoldersOpen(true)}
            />

            {/* Bulk Update Dates Modal */}
            <BulkUpdateTasksModal
                isOpen={isBulkDateModalOpen}
                onClose={() => setIsBulkDateModalOpen(false)}
                taskCount={selectedTaskIds.size}
                members={project?.members || []}
                projectStartDate={project?.startDate}
                projectEndDate={project?.endDate}
                onUpdate={handleBulkUpdateDates}
            />

            {/* Bulk Action Bar (when tasks are selected) */}
            {selectedTaskIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--app-card)] text-[var(--app-text)] border border-[var(--app-border-strong)] shadow-2xl rounded-[4px] px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="flex items-center gap-2 pr-3 border-r border-[var(--app-border)]">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[11px] font-bold flex items-center justify-center">
                            {selectedTaskIds.size}
                        </span>
                        <span className="text-xs font-semibold">
                            {selectedTaskIds.size === 1 ? "1 task selected" : `${selectedTaskIds.size} tasks selected`}
                        </span>
                    </div>

                    {canManageTasks && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsMoveTasksModalOpen(true)}
                            icon={<Folder className="w-3.5 h-3.5" />}
                            className="!h-8 !text-xs font-semibold"
                        >
                            Move to Folder
                        </Button>
                    )}

                    {canManageTasks && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsBulkDateModalOpen(true)}
                            icon={<CalendarRange className="w-3.5 h-3.5" />}
                            className="!h-8 !text-xs font-semibold"
                        >
                            Update Dates
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTaskIds(new Set())}
                        className="!h-8 !text-xs text-[var(--app-muted)] hover:text-[var(--app-text)]"
                    >
                        Deselect All
                    </Button>
                </div>
            )}
        </div>
    );
}
