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
    CheckSquare
} from "lucide-react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Button } from "../ui/Button";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { UserAvatar } from "../ui/UserAvatar";
import CreateProjectTaskModal from "./CreateProjectTaskModal";
import UpdateProjectTaskModal from "./UpdateProjectTaskModal";
import { calculateTaskProgress } from "../../utils/projectProgress";
import { getProjectPermissions } from "../../utils/projectPermissions";
import { getLocalDateString, extractDateString } from "../../utils/date";

const PRIORITY_OPTIONS: SelectOption[] = [
    { value: "ALL", label: "All Priorities" },
    { value: "URGENT", label: "Urgent" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

function stripHtml(html: string) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
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
        case "CriticalSLA": return { label: "SLA Breach", cls: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20" };
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
}: {
    task: any;
    projectId: string;
    columnMap: Record<string, any>;
    canManageTasks: boolean;
    onEditTask: (task: any) => void;
}) {
    const router = useRouter();
    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter((s: any) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;
    const totalSubtasks = subtasks.length;
    const progressPercent = calculateTaskProgress(task, columnMap);

    const priorityDetails = getPriorityDetails(task.priority);
    const statusConfig = getDerivedStatus(task, columnMap);
    const riskBadge = getRiskBadge(task.riskLevel);
    const column = columnMap[task.columnId];

    // Clean description HTML tags
    const cleanDescription = stripHtml(task.description || "");

    // Normalize assignees list
    const assigneesList: any[] = [];
    if (Array.isArray(task.assignees)) {
        task.assignees.forEach((a: any) => {
            if (a.user) assigneesList.push(a.user);
            else assigneesList.push(a);
        });
    }

    return (
        <div
            className={`group relative bg-[var(--app-card)] border border-[var(--app-border)] ${priorityDetails.accentBorder} hover:border-[var(--app-border-strong)] rounded-[4px] p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 cursor-pointer shadow-subtle hover:shadow-sm min-h-[210px]`}
            onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
        >
            {/* Top Row: Workflow Stage Chip + Priority & Risk Badges */}
            <div className="flex items-center justify-between gap-2">
                {/* Left: Workflow Stage Chip */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                        className="text-[9.5px] font-semibold text-[var(--app-text)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] flex items-center gap-1 shrink-0" 
                        title={`Workflow Stage: ${column?.name || 'Backlog'}`}
                    >
                        <ListTodo className="w-3 h-3 text-[var(--app-muted)]" />
                        <span className="truncate max-w-[110px]">{column?.name || "Deliverable"}</span>
                    </span>
                    {statusConfig.label && statusConfig.label !== column?.name && (
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border flex items-center gap-1 shrink-0 ${statusConfig.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotCls}`} />
                            <span>{statusConfig.label}</span>
                        </span>
                    )}
                </div>

                {/* Right: Priority, Risk & Edit Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded-[2px] border ${priorityDetails.badgeCls}`}>
                        {priorityDetails.label}
                    </span>
                    {riskBadge && (
                        <span className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded-[2px] border ${riskBadge.cls}`}>
                            {riskBadge.label}
                        </span>
                    )}
                    {canManageTasks && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                            }}
                            title="Edit Main Task"
                            className="p-1 rounded-[2px] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent hover:border-[var(--app-border)] transition-colors cursor-pointer"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Task Content: Title + Description */}
            <div className="flex flex-col gap-1">
                <h3 className="text-[13.5px] font-semibold text-[var(--app-text)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 leading-snug">
                    {task.title}
                </h3>
                {cleanDescription ? (
                    <p className="text-[11px] text-[var(--app-muted)] line-clamp-2 leading-relaxed min-h-[30px]">
                        {cleanDescription}
                    </p>
                ) : (
                    <p className="text-[11px] text-[var(--app-muted)] italic opacity-50 min-h-[30px]">
                        No description provided
                    </p>
                )}
            </div>

            {/* Subtask Breakdown / Checklist Tracker Box */}
            <div className="bg-[var(--app-bg)]/60 border border-[var(--app-border)]/80 rounded-[3px] p-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--app-muted)] flex items-center gap-1.5 font-medium">
                        <CheckSquare className="w-3 h-3 text-[var(--app-muted)]" />
                        <span>Subtasks</span>
                    </span>
                    <span className="font-semibold text-[var(--app-text)] tabular-nums">
                        {totalSubtasks > 0 
                            ? `${doneSubtasks}/${totalSubtasks} Done (${progressPercent}%)` 
                            : (task.isCompleted ? "100% Completed" : "0 Subtasks")}
                    </span>
                </div>

                {/* Subtask Progress Track */}
                <div className="w-full bg-[var(--app-card)] border border-[var(--app-border)] h-1.5 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 rounded-full ${
                            progressPercent === 100
                                ? "bg-[var(--color-success,#22863A)]"
                                : progressPercent > 0
                                ? "bg-[var(--status-in-progress,#7C3AED)]"
                                : "bg-[var(--app-border-strong)]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Footer Row: Avatars, Due Date & Navigation Arrow */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[var(--app-border)] text-[10px]">
                {/* Left: Assignees + Date */}
                <div className="flex items-center gap-2">
                    {/* Avatars Stack */}
                    <div className="flex -space-x-1.5">
                        {assigneesList.length > 0 ? (
                            assigneesList.slice(0, 3).map((user, idx) => {
                                const name = user.name || user.fullName || "User";
                                const avatarUrl = user.avatarUrl || user.user?.avatarUrl;
                                return (
                                    <UserAvatar
                                        key={user.id || idx}
                                        name={name}
                                        avatarUrl={avatarUrl}
                                        size="xs"
                                        title={name}
                                    />
                                );
                            })
                        ) : (
                            <span className="text-[9.5px] text-[var(--app-muted)] italic">Unassigned</span>
                        )}
                        {assigneesList.length > 3 && (
                            <div className="w-4 h-4 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center text-[7.5px] font-semibold text-[var(--app-muted)] shrink-0">
                                +{assigneesList.length - 3}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-[9.5px] text-[var(--app-muted)] bg-[var(--app-bg)] px-1.5 py-0.5 rounded-[2px] border border-[var(--app-border)] shrink-0">
                            <Calendar className="w-2.5 h-2.5 text-[var(--app-muted)]" />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                    )}
                </div>

                {/* Right: Action link with subtask count */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--app-muted)] group-hover:text-[var(--app-text)] transition-colors">
                    <span>{totalSubtasks > 0 ? `Subtasks (${totalSubtasks})` : "View Subtasks"}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
}

function MainTaskListItem({
    task,
    projectId,
    columnMap,
    canManageTasks,
    onEditTask,
}: {
    task: any;
    projectId: string;
    columnMap: Record<string, any>;
    canManageTasks: boolean;
    onEditTask: (task: any) => void;
}) {
    const router = useRouter();
    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter((s: any) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;
    const totalSubtasks = subtasks.length;
    const progressPercent = calculateTaskProgress(task, columnMap);

    const priorityDetails = getPriorityDetails(task.priority);
    const statusConfig = getDerivedStatus(task, columnMap);
    const riskBadge = getRiskBadge(task.riskLevel);
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
            className="group border-b border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer text-xs"
            onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
        >
            {/* Status & Stage */}
            <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${priorityDetails.dotCls}`} title={`Priority: ${priorityDetails.label}`} />
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-[2px] border inline-flex items-center gap-1.5 ${statusConfig.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotCls}`} />
                        {statusConfig.label}
                    </span>
                </div>
            </td>

            {/* Task Title & Column */}
            <td className="py-3.5 px-4 min-w-[220px]">
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[13px] text-[var(--app-text)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                        {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--app-muted)]">
                        {column?.name && (
                            <span className="font-medium text-[var(--app-text)] bg-[var(--app-bg)] px-1 py-0.2 rounded-[2px] border border-[var(--app-border)]">
                                {column.name}
                            </span>
                        )}
                        {cleanDescription && (
                            <span className="line-clamp-1 max-w-[280px]">{cleanDescription}</span>
                        )}
                    </div>
                </div>
            </td>

            {/* Priority & Risk */}
            <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded-[2px] border ${priorityDetails.badgeCls}`}>
                        {priorityDetails.label}
                    </span>
                    {riskBadge && (
                        <span className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded-[2px] border ${riskBadge.cls}`}>
                            {riskBadge.label}
                        </span>
                    )}
                </div>
            </td>

            {/* Assignees Squad */}
            <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                        {assigneesList.length > 0 ? (
                            assigneesList.slice(0, 3).map((user, idx) => {
                                const name = user.name || user.fullName || "User";
                                const avatarUrl = user.avatarUrl || user.user?.avatarUrl;
                                return (
                                    <UserAvatar
                                        key={user.id || idx}
                                        name={name}
                                        avatarUrl={avatarUrl}
                                        size="xs"
                                        title={name}
                                    />
                                );
                            })
                        ) : (
                            <span className="text-[9.5px] text-[var(--app-muted)] italic">Unassigned</span>
                        )}
                        {assigneesList.length > 3 && (
                            <div className="w-4 h-4 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center text-[7.5px] font-semibold text-[var(--app-muted)] shrink-0">
                                +{assigneesList.length - 3}
                            </div>
                        )}
                    </div>
                    {assigneesList.length === 1 && (
                        <span className="text-[10px] text-[var(--app-text)] font-medium truncate max-w-[90px]">
                            {assigneesList[0].name || assigneesList[0].fullName}
                        </span>
                    )}
                </div>
            </td>

            {/* Due Date */}
            <td className="py-3 px-4 whitespace-nowrap text-[10px] text-[var(--app-muted)]">
                {task.dueDate ? (
                    <div className="flex items-center gap-1.5 bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] w-fit">
                        <Calendar className="w-2.5 h-2.5 text-[var(--app-muted)]" />
                        <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </div>
                ) : (
                    <span>—</span>
                )}
            </td>

            {/* Subtask Progress */}
            <td className="py-3 px-4 min-w-[160px]">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-[var(--app-muted)] tabular-nums">
                            {totalSubtasks > 0 ? `${doneSubtasks}/${totalSubtasks} Subtasks` : "No Subtasks"}
                        </span>
                        <span className="font-semibold text-[var(--app-text)] tabular-nums">
                            {progressPercent}%
                        </span>
                    </div>
                    <div className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 rounded-full ${
                                progressPercent === 100
                                    ? "bg-[var(--color-success,#22863A)]"
                                    : progressPercent > 0
                                    ? "bg-[var(--status-in-progress,#7C3AED)]"
                                    : "bg-[var(--app-border-strong)]"
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
                            <Edit2 className="w-3 h-3" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
                        className="px-2.5 py-1 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-muted)] hover:text-[var(--app-text)] text-[10.5px] font-medium rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                        <span>Subtasks</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

interface ProjectBoardViewProps {
    project: any;
    onRefresh?: (silent?: boolean) => void;
}

export default function ProjectBoardView({ project, onRefresh }: ProjectBoardViewProps) {
    const { currentUser, userRole } = useWorkspace();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
    const [filterMode, setFilterMode] = useState<"all" | "my-tasks">("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);

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

    // Initialize preferred viewMode from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("project_main_tasks_view_mode");
            if (saved === "list" || saved === "grid") {
                setViewMode(saved);
            }
        } catch (e) {}
    }, []);

    const handleViewModeChange = (mode: "grid" | "list") => {
        setViewMode(mode);
        try {
            localStorage.setItem("project_main_tasks_view_mode", mode);
        } catch (e) {}
    };

    const { currentTeam } = useWorkspace();
    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const canManageTasks = permissions.canManageTasks;

    const tasks = project?.tasks || [];
    const columns = project?.columns || [];

    // Map column ID to column object
    const columnMap: Record<string, any> = {};
    columns.forEach((col: any) => {
        columnMap[col.id] = col;
    });

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

    // Filter tasks based on search, priority, date, and assignment
    const filteredTasks = tasks.filter((t: any) => {
        const matchesSearch =
            searchQuery === "" ||
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority =
            selectedPriority === "ALL" || (t.priority || "").toUpperCase() === selectedPriority;

        const isAssignedToMe =
            (Array.isArray(t.assignees) &&
                t.assignees.some((a: any) => (a.userId || a.user?.id || a.id) === currentUser?.id)) ||
            (Array.isArray(t.subtasks) &&
                t.subtasks.some((st: any) => (st.assignedToId || st.assignedTo?.id) === currentUser?.id));

        const matchesFilterMode = filterMode === "all" || isAssignedToMe;
        const matchesDate =
            dateFilterMode === "all" ||
            (dateFilterMode === "range" && isTaskActiveInRange(t, rangeStartDate, rangeEndDate));

        return matchesSearch && matchesPriority && matchesFilterMode && matchesDate;
    });

    const activeFilterCount =
        (dateFilterMode !== "all" ? 1 : 0) +
        (selectedPriority !== "ALL" ? 1 : 0) +
        (filterMode !== "all" ? 1 : 0) +
        (searchQuery.trim() !== "" ? 1 : 0);

    const handleClearAllFilters = () => {
        setDateFilterMode("all");
        setSelectedPriority("ALL");
        setFilterMode("all");
        setSearchQuery("");
    };

    const handleOpenEditTask = (taskToEdit: any) => {
        setEditingTask(taskToEdit);
        setIsEditTaskModalOpen(true);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)]">
            {/* Header Toolbar */}
            <div className="shrink-0 px-5 py-2.5 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-wrap items-center justify-between gap-3 select-none">
                {/* Group 1: Task Filters (Search, Priority, Date Range Filter) */}
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    {/* Search */}
                    <div className="relative w-48 sm:w-60 h-[32px] shrink-0">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search main tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-[32px] bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] focus:border-[var(--app-border-strong)] rounded-[2px] pl-7 pr-3 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none transition-colors corner-brackets-4"
                        />
                    </div>

                    {/* Priority Filter */}
                    <CustomSelect
                        options={PRIORITY_OPTIONS}
                        value={selectedPriority}
                        onChange={setSelectedPriority}
                        buttonClassName="corner-brackets-4 text-xs h-[32px] !py-0 px-3 bg-[var(--app-card)]"
                        className="w-36 h-[32px] shrink-0"
                    />

                    {/* Date Filter: All Dates vs Date Range */}
                    <div className="flex items-center h-[32px] bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-xs font-medium shrink-0">
                        <button
                            type="button"
                            onClick={() => setDateFilterMode("all")}
                            className={`h-full px-3 rounded-[1px] transition-all cursor-pointer flex items-center justify-center ${
                                dateFilterMode === "all"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                            }`}
                        >
                            All Dates
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateFilterMode("range")}
                            className={`h-full px-3 rounded-[1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                dateFilterMode === "range"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                            }`}
                        >
                            <CalendarRange className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            <span>Date Range</span>
                        </button>
                    </div>

                    {/* Date Range Selector & Presets */}
                    {dateFilterMode === "range" && (
                        <div className="flex items-center gap-2 shrink-0 animate-fade-in flex-wrap">
                            <div className="flex items-center h-[32px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-1.5 py-0.5 shadow-2xs gap-1">
                                <CustomDatePicker
                                    value={rangeStartDate}
                                    onChange={(val) => {
                                        setRangeStartDate(val);
                                        if (rangeEndDate && val > rangeEndDate) setRangeEndDate(val);
                                    }}
                                    placeholder="Start Date"
                                    minDate={projectStartDate}
                                    maxDate={projectEndDate}
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
                                    minDate={rangeStartDate || projectStartDate}
                                    maxDate={projectEndDate}
                                    buttonClassName="border-0 shadow-none bg-transparent hover:bg-[var(--app-hover-bg)] h-full py-0 px-2 text-xs font-medium"
                                    className="w-28 h-full flex items-center"
                                />
                            </div>

                            <div className="hidden sm:flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleSetRangePreset("month")}
                                    className="h-[32px] px-2.5 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                                >
                                    This Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetRangePreset("30days")}
                                    className="h-[32px] px-2.5 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                                >
                                    30 Days
                                </button>
                                {projectStartDate && projectEndDate && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetRangePreset("project")}
                                        className="h-[32px] px-2.5 text-[11px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
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
                            icon={<X className="w-3.5 h-3.5" />}
                            onClick={handleClearAllFilters}
                            className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 animate-fade-in shrink-0"
                            title="Reset all search, date, priority, and assignment filters"
                        >
                            Reset ({activeFilterCount})
                        </Button>
                    )}
                </div>

                {/* Right: Group 2 (Scope) + Group 3 (View Mode & Count) + Primary Action */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {/* Scope Segmented Toggle (All Tasks vs Assigned to Me) */}
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
                            <span>All</span>
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
                                    }`}>
                                    ({myTasksCount})
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="w-px h-5 bg-[var(--app-border)] hidden sm:block" />

                    {/* View Switcher: Grid vs List */}
                    <div className="flex items-center gap-2.5 shrink-0">
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

                        <span className="text-xs text-[var(--app-muted)] hidden sm:inline select-none">
                            Showing <span className="font-semibold text-[var(--app-text)] tabular-nums">{filteredTasks.length}</span> {filteredTasks.length === 1 ? "main task" : "main tasks"}
                        </span>
                    </div>

                    {/* Add Main Task Action */}
                    {canManageTasks && (
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setIsCreateTaskModalOpen(true)}
                        >
                            Add Main Task
                        </Button>
                    )}
                </div>
            </div>

            {/* Content View: Grid or List */}
            <div className="flex-1 overflow-y-auto p-5">
                {filteredTasks.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[var(--app-border)] rounded-[3px] text-center p-6 bg-[var(--app-card)] relative corner-brackets-4">
                        <Layers className="w-8 h-8 text-[var(--app-muted)] mb-2" />
                        <h4 className="text-sm font-semibold text-[var(--app-text)] mb-1">No Main Tasks Found</h4>
                        <p className="text-[11px] text-[var(--app-muted)] max-w-sm mb-4">
                            {searchQuery
                                ? "No tasks matched your search query or filter."
                                : dateFilterMode === "range"
                                ? "No tasks are active within the selected date range."
                                : "Get started by creating your first main task for this project."}
                        </p>
                        <div className="flex items-center gap-2">
                            {dateFilterMode === "range" && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setDateFilterMode("all")}
                                >
                                    Show All Dates
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTasks.map((task: any) => (
                            <MainTaskGridCard
                                key={task.id}
                                task={task}
                                projectId={project.id}
                                columnMap={columnMap}
                                canManageTasks={canManageTasks}
                                onEditTask={handleOpenEditTask}
                            />
                        ))}
                    </div>
                ) : (
                    /* List / Table View */
                    <div className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-card)] overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)] text-[10px] font-medium text-[var(--app-muted)]">
                                        <th className="py-3 px-4 font-semibold">Status</th>
                                        <th className="py-3 px-4 font-semibold">Task & Category</th>
                                        <th className="py-3 px-4 font-semibold">Priority</th>
                                        <th className="py-3 px-4 font-semibold">Squad</th>
                                        <th className="py-3 px-4 font-semibold">Due Date</th>
                                        <th className="py-3 px-4 font-semibold">Subtasks Progress</th>
                                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map((task: any) => (
                                        <MainTaskListItem
                                            key={task.id}
                                            task={task}
                                            projectId={project.id}
                                            columnMap={columnMap}
                                            canManageTasks={canManageTasks}
                                            onEditTask={handleOpenEditTask}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

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
        </div>
    );
}
