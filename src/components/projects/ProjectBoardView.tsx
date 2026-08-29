"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Calendar, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, Layers, Clock, Edit2, User, LayoutGrid, List } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Button } from "../ui/Button";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { UserAvatar } from "../ui/UserAvatar";
import CreateProjectTaskModal from "./CreateProjectTaskModal";
import UpdateProjectTaskModal from "./UpdateProjectTaskModal";
import { calculateTaskProgress } from "../../utils/projectProgress";
import { getProjectPermissions } from "../../utils/projectPermissions";
import { getLocalDateString, parseLocalDate, extractDateString } from "../../utils/date";

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

function getPriorityStyle(priority: string) {
    const p = (priority || "").toUpperCase();
    switch (p) {
        case "URGENT":
        case "Urgent": return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
        case "HIGH":
        case "High": return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
        case "MEDIUM":
        case "Medium": return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
        default: return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
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
            className="group relative corner-brackets-4 bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[2px] p-4 flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm"
            onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
        >
            {/* Top Row: Derived Status + Priority & Risk Badges & Optional Edit Button */}
            <div className="flex items-center justify-between gap-2">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-[2px] border flex items-center gap-1.5 ${statusConfig.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotCls}`} />
                    {statusConfig.label}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${getPriorityStyle(task.priority)}`}>
                        {task.priority || "MEDIUM"}
                    </span>
                    {riskBadge && (
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${riskBadge.cls}`}>
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

            {/* Content Section: Category/Column + Title + Cleaned Description */}
            <div className="flex flex-col gap-1.5">
                {column?.name && (
                    <span className="text-[10px] font-medium text-[var(--app-muted)]">
                        {column.name}
                    </span>
                )}
                <h3 className="text-sm font-semibold text-[var(--app-text)] line-clamp-2 leading-snug">
                    {task.title}
                </h3>
                {cleanDescription && (
                    <p className="text-[11px] text-[var(--app-muted)] line-clamp-2 leading-relaxed">
                        {cleanDescription}
                    </p>
                )}
            </div>

            {/* Cumulative Progress Section */}
            <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--app-muted)] flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[var(--app-muted)] shrink-0" />
                        <span>Subtask Progress</span>
                    </span>
                    <span className="font-medium text-[var(--app-text)] tabular-nums">
                        {totalSubtasks > 0 ? `${doneSubtasks}/${totalSubtasks} Done (${progressPercent}%)` : (task.isCompleted ? "100%" : "No Subtasks")}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 rounded-full ${
                            progressPercent === 100
                                ? "bg-[#22863A]"
                                : progressPercent > 0
                                ? "bg-[#0284C7]"
                                : "bg-[var(--app-border-strong)]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Footer Row: Avatars, Due Date & Navigation Arrow */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--app-border)] text-[10px]">
                {/* Left: Assignees + Date */}
                <div className="flex items-center gap-2.5">
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
                            <span className="text-[9px] text-[var(--app-muted)] italic">Unassigned</span>
                        )}
                        {assigneesList.length > 3 && (
                            <div className="w-4 h-4 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center text-[7px] font-semibold text-[var(--app-muted)] shrink-0">
                                +{assigneesList.length - 3}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-[9px] text-[var(--app-muted)] shrink-0">
                            <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        </div>
                    )}
                </div>

                {/* Right: Action link */}
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--app-muted)] group-hover:text-[var(--app-text)] transition-colors">
                    <span>View Subtasks</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
            {/* Status */}
            <td className="py-3 px-4 whitespace-nowrap">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-[2px] border inline-flex items-center gap-1.5 ${statusConfig.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotCls}`} />
                    {statusConfig.label}
                </span>
            </td>

            {/* Task Title & Column */}
            <td className="py-3.5 px-4 min-w-[220px]">
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-[13px] text-[var(--app-text)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                        {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--app-muted)]">
                        {column?.name && <span>{column.name}</span>}
                        {cleanDescription && (
                            <>
                                <span>•</span>
                                <span className="line-clamp-1 max-w-[280px]">{cleanDescription}</span>
                            </>
                        )}
                    </div>
                </div>
            </td>

            {/* Priority & Risk */}
            <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${getPriorityStyle(task.priority)}`}>
                        {task.priority || "MEDIUM"}
                    </span>
                    {riskBadge && (
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${riskBadge.cls}`}>
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
                            <span className="text-[9px] text-[var(--app-muted)] italic">Unassigned</span>
                        )}
                        {assigneesList.length > 3 && (
                            <div className="w-4 h-4 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center text-[7px] font-semibold text-[var(--app-muted)] shrink-0">
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
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                        <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </div>
                ) : (
                    <span>—</span>
                )}
            </td>

            {/* Subtask Progress */}
            <td className="py-3 px-4 min-w-[160px]">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px]">
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
                                    ? "bg-[#22863A]"
                                    : progressPercent > 0
                                    ? "bg-[#0284C7]"
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
                        className="px-2 py-1 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] text-[10px] font-medium rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer"
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
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any | null>(null);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);

    const projectStartDate = extractDateString(project?.startDate);
    const projectEndDate = extractDateString(project?.endDate);
    const todayStr = getLocalDateString(new Date());

    const getInitialDate = () => {
        if (projectStartDate && todayStr < projectStartDate) {
            return projectStartDate;
        }
        if (projectEndDate && todayStr > projectEndDate) {
            return projectEndDate;
        }
        return todayStr;
    };

    const [dateFilterMode, setDateFilterMode] = useState<"all" | "day">("day");
    const [selectedDate, setSelectedDate] = useState<string>(getInitialDate);

    useEffect(() => {
        if (selectedDate) {
            if (projectStartDate && selectedDate < projectStartDate) {
                setSelectedDate(projectStartDate);
            } else if (projectEndDate && selectedDate > projectEndDate) {
                setSelectedDate(projectEndDate);
            }
        } else {
            setSelectedDate(getInitialDate());
        }
    }, [projectStartDate, projectEndDate]);

    const handlePrevDay = () => {
        if (!selectedDate) return;
        const d = parseLocalDate(selectedDate);
        d.setDate(d.getDate() - 1);
        const prevStr = getLocalDateString(d);
        if (projectStartDate && prevStr < projectStartDate) return;
        setSelectedDate(prevStr);
    };

    const handleNextDay = () => {
        if (!selectedDate) return;
        const d = parseLocalDate(selectedDate);
        d.setDate(d.getDate() + 1);
        const nextStr = getLocalDateString(d);
        if (projectEndDate && nextStr > projectEndDate) return;
        setSelectedDate(nextStr);
    };

    const isPrevDisabled = Boolean(projectStartDate && selectedDate <= projectStartDate);
    const isNextDisabled = Boolean(projectEndDate && selectedDate >= projectEndDate);

    const isTaskActiveOnDate = (task: any, dateStr: string) => {
        if (!dateStr) return true;
        const taskStart = extractDateString(task.startDate);
        const taskDue = extractDateString(task.dueDate);

        // If both start and due date are set: task spans between startDate and dueDate
        if (taskStart && taskDue) {
            return dateStr >= taskStart && dateStr <= taskDue;
        }
        // If only due date is set
        if (taskDue) {
            return dateStr === taskDue;
        }
        // If only start date is set
        if (taskStart) {
            return dateStr === taskStart;
        }
        // If no dates specified on task, show it
        return true;
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

    // Count tasks assigned to current user (either main task assignee or subtask assignee)
    const myTasksCount = tasks.filter((t: any) => {
        const isMainAssignee =
            Array.isArray(t.assignees) &&
            t.assignees.some((a: any) => (a.userId || a.user?.id || a.id) === currentUser?.id);
        const isSubtaskAssignee =
            Array.isArray(t.subtasks) &&
            t.subtasks.some((st: any) => (st.assignedToId || st.assignedTo?.id) === currentUser?.id);
        return isMainAssignee || isSubtaskAssignee;
    }).length;

    // Filter tasks based on search, priority, date, and "Assigned to Me" quick filter
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
        const matchesDate = dateFilterMode === "all" || isTaskActiveOnDate(t, selectedDate);

        return matchesSearch && matchesPriority && matchesFilterMode && matchesDate;
    });

    const handleOpenEditTask = (taskToEdit: any) => {
        setEditingTask(taskToEdit);
        setIsEditTaskModalOpen(true);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)]">
            {/* Header Toolbar */}
            <div className="shrink-0 px-5 py-3 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-wrap items-center justify-between gap-3">
                {/* Search & Priority Filter & Date Navigation & Quick View Segmented Toggle */}
                <div className="flex items-center gap-2.5 flex-1 min-w-[240px] flex-wrap">
                    <div className="relative flex-1 min-w-[160px] max-w-xs corner-brackets-4">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                        <input
                            type="text"
                            placeholder="Filter main tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] pl-8 pr-3 py-1 text-[11px] text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--app-border-strong)] transition-colors"
                        />
                    </div>

                    <CustomSelect
                        options={PRIORITY_OPTIONS}
                        value={selectedPriority}
                        onChange={setSelectedPriority}
                        buttonClassName="corner-brackets-4 text-[10px] h-[28px] py-0.5"
                        className="w-32 shrink-0"
                    />

                    {/* Date Navigation & View Mode */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Segmented Pill Toggle: All Dates vs Day View */}
                        <div className="flex items-center h-[28px] bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-0.5 text-[10px] font-medium">
                            <button
                                type="button"
                                onClick={() => setDateFilterMode("all")}
                                className={`h-full px-2.5 rounded-[2px] transition-all cursor-pointer flex items-center justify-center ${
                                    dateFilterMode === "all"
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                            >
                                All Dates
                            </button>
                            <button
                                type="button"
                                onClick={() => setDateFilterMode("day")}
                                className={`h-full px-2.5 rounded-[2px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    dateFilterMode === "day"
                                        ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border)]"
                                        : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                                }`}
                            >
                                <Calendar className="w-3 h-3 text-[var(--app-muted)]" />
                                <span>Day View</span>
                            </button>
                        </div>

                        {/* Day Navigator (when in Day View) */}
                        {dateFilterMode === "day" && (
                            <div className="flex items-center h-[28px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-0.5 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={handlePrevDay}
                                    disabled={isPrevDisabled}
                                    className="h-full px-1 flex items-center justify-center text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] disabled:opacity-25 disabled:cursor-not-allowed rounded-[2px] transition-colors cursor-pointer"
                                    title={isPrevDisabled ? "Reached project start date" : "Previous Day"}
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </button>

                                <CustomDatePicker
                                    value={selectedDate}
                                    onChange={(val) => setSelectedDate(val)}
                                    minDate={projectStartDate}
                                    maxDate={projectEndDate}
                                    buttonClassName="border-0 shadow-none bg-transparent hover:bg-[var(--app-hover-bg)] h-full py-0 px-2 text-[10px] font-medium"
                                    className="w-28 h-full flex items-center"
                                />

                                <button
                                    type="button"
                                    onClick={handleNextDay}
                                    disabled={isNextDisabled}
                                    className="h-full px-1 flex items-center justify-center text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] disabled:opacity-25 disabled:cursor-not-allowed rounded-[2px] transition-colors cursor-pointer"
                                    title={isNextDisabled ? "Reached project end date" : "Next Day"}
                                >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick View Segmented Toggle: All Tasks vs Assigned to Me */}
                    <div className="flex items-center bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-[10px] font-medium shrink-0">
                        <button
                            type="button"
                            onClick={() => setFilterMode("all")}
                            className={`px-2.5 py-1 rounded-[1px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                filterMode === "all"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <span>All</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-[2px] border transition-colors tabular-nums ${
                                filterMode === "all"
                                    ? "bg-[var(--app-card)] border-[var(--app-border-strong)] text-[var(--app-text)] font-semibold"
                                    : "bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-muted)] font-medium"
                            }`}>
                                {tasks.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode("my-tasks")}
                            className={`px-2.5 py-1 rounded-[1px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                filterMode === "my-tasks"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <User className="w-3 h-3 text-[var(--app-muted)]" />
                            <span>My Tasks</span>
                            {myTasksCount > 0 && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-[2px] border transition-colors tabular-nums ${
                                    filterMode === "my-tasks"
                                        ? "bg-[var(--app-card)] border-[var(--app-border-strong)] text-[var(--app-text)] font-semibold"
                                        : "bg-[var(--app-bg)] border-[var(--app-border)] text-[var(--app-muted)] font-medium"
                                }`}>
                                    {myTasksCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: View Switcher, Task Count & Add Main Task Button */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* View Switcher: Grid vs List */}
                    <div className="flex items-center bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-[10px] font-medium shrink-0">
                        <button
                            type="button"
                            onClick={() => handleViewModeChange("grid")}
                            className={`p-1.5 rounded-[1px] transition-colors cursor-pointer flex items-center justify-center ${
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
                            className={`p-1.5 rounded-[1px] transition-colors cursor-pointer flex items-center justify-center ${
                                viewMode === "list"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] border border-transparent"
                            }`}
                            title="List View"
                        >
                            <List className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <span className="text-[10px] text-[var(--app-muted)] hidden sm:inline">
                        Showing <span className="font-semibold text-[var(--app-text)] tabular-nums">{filteredTasks.length}</span> main tasks
                    </span>

                    {canManageTasks && (
                        <button
                            type="button"
                            onClick={() => setIsCreateTaskModalOpen(true)}
                            className="relative corner-brackets-4 px-3.5 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                        >
                            <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                            <span>Add Main Task</span>
                        </button>
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
                                : dateFilterMode === "day"
                                ? `No tasks are active on ${new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}.`
                                : "Get started by creating your first main task for this project."}
                        </p>
                        <div className="flex items-center gap-2">
                            {dateFilterMode === "day" && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
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
