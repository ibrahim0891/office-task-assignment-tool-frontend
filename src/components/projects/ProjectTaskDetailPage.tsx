"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import {
    ArrowLeft,
    CheckCircle2,
    Calendar,
    Clock,
    User,
    AlertTriangle,
    ShieldAlert,
    RotateCcw,
    Plus,
    ChevronRight,
    ChevronLeft,
    Layers,
    Kanban,
    ListFilter,
    Loader2,
    Edit2,
    Trash2,
    Columns,
    MoreHorizontal,
    CheckSquare,
    GripVertical,
} from "lucide-react";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { triggerMicroCelebration } from "../../utils/confetti";
import { playFeedback } from "../../utils/feedback";
import UpdateProjectTaskModal from "./UpdateProjectTaskModal";
import ProjectColumnModal from "./ProjectColumnModal";
import ProjectSubtaskModal from "./ProjectSubtaskModal";
import { useProjectDetail } from "../../hooks/useProjectSWR";
import { SubtaskKanbanCard } from "./SubtaskKanbanCard";
import ProjectSubtaskDetailSkeleton from "./ProjectSubtaskDetailSkeleton";
import { UserAvatar } from "../ui/UserAvatar";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import { calculateTaskProgress, isSystemColumn, getStageMeta } from "../../utils/projectProgress";
import { getProjectPermissions } from "../../utils/projectPermissions";
import { getLocalDateString, parseLocalDate, extractDateString } from "../../utils/date";

function getPriorityBadge(priority: string) {
    switch (priority) {
        case "Urgent":
        case "URGENT":
            return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
        case "High":
        case "HIGH":
            return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
        case "Medium":
        case "MEDIUM":
            return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
        default:
            return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
    }
}

interface ColumnDef {
    id: string;
    name: string;
    type?: string;
    order: number;
    isComplete?: boolean;
}

const DEFAULT_SUBTASK_COLUMNS: ColumnDef[] = [
    { id: "col-todo", name: "To Do", type: "SYSTEM", order: 0, isComplete: false },
    { id: "col-progress", name: "In Progress", type: "SYSTEM", order: 1, isComplete: false },
    { id: "col-review", name: "Under Review", type: "SYSTEM", order: 2, isComplete: false },
    { id: "col-done", name: "Completed", type: "SYSTEM", order: 3, isComplete: true },
];

export default function ProjectTaskDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;
    const taskId = params.taskId as string;
    const { currentTeam, currentUser, userRole } = useWorkspace();

    const { project, isLoading, mutate: refreshProject } = useProjectDetail(projectId, currentTeam?.id);
    const [subtasks, setSubtasks] = useState<any[]>([]);

    const task = React.useMemo(() => {
        return (project?.tasks || []).find((t: any) => t.id === taskId) || null;
    }, [project?.tasks, taskId]);

    useEffect(() => {
        if (task?.subtasks) {
            setSubtasks(task.subtasks);
        }
    }, [task?.subtasks]);

    // Modals
    const [isEditMainTaskModalOpen, setIsEditMainTaskModalOpen] = useState(false);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [columnModalInitialData, setColumnModalInitialData] = useState<any | null>(null);
    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
    const [subtaskModalData, setSubtaskModalData] = useState<any | null>(null);
    const [subtaskModalInitialColStatus, setSubtaskModalInitialColStatus] = useState("Backlog");

    // Filters
    const [memberFilter, setMemberFilter] = useState<string>("");

    const taskStartDate = extractDateString(task?.startDate) || extractDateString(project?.startDate);
    const taskDueDate = extractDateString(task?.dueDate) || extractDateString(project?.endDate);
    const todayStr = getLocalDateString(new Date());

    const getInitialDate = () => {
        if (taskStartDate && todayStr < taskStartDate) {
            return taskStartDate;
        }
        if (taskDueDate && todayStr > taskDueDate) {
            return taskDueDate;
        }
        return todayStr;
    };

    const [dateFilterMode, setDateFilterMode] = useState<"all" | "day">("day");
    const [selectedDate, setSelectedDate] = useState<string>(getInitialDate);

    useEffect(() => {
        if (selectedDate) {
            if (taskStartDate && selectedDate < taskStartDate) {
                setSelectedDate(taskStartDate);
            } else if (taskDueDate && selectedDate > taskDueDate) {
                setSelectedDate(taskDueDate);
            }
        } else {
            setSelectedDate(getInitialDate());
        }
    }, [taskStartDate, taskDueDate]);

    const handlePrevDay = () => {
        if (!selectedDate) return;
        const d = parseLocalDate(selectedDate);
        d.setDate(d.getDate() - 1);
        const prevStr = getLocalDateString(d);
        if (taskStartDate && prevStr < taskStartDate) return;
        setSelectedDate(prevStr);
    };

    const handleNextDay = () => {
        if (!selectedDate) return;
        const d = parseLocalDate(selectedDate);
        d.setDate(d.getDate() + 1);
        const nextStr = getLocalDateString(d);
        if (taskDueDate && nextStr > taskDueDate) return;
        setSelectedDate(nextStr);
    };

    const isPrevDisabled = Boolean(taskStartDate && selectedDate <= taskStartDate);
    const isNextDisabled = Boolean(taskDueDate && selectedDate >= taskDueDate);

    const isSubtaskActiveOnDate = (st: any, dateStr: string) => {
        if (!dateStr) return true;
        const stStart = extractDateString(st.startDate);
        const stDue = extractDateString(st.dueDate);

        // If both start and due date are set: subtask spans between startDate and dueDate
        if (stStart && stDue) {
            return dateStr >= stStart && dateStr <= stDue;
        }
        // If only due date is set
        if (stDue) {
            return dateStr === stDue;
        }
        // If only start date is set
        if (stStart) {
            return dateStr === stStart;
        }
        // If no dates specified on subtask, show it
        return true;
    };

    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const isAssignedToMainTask =
        Array.isArray(task?.assignees) &&
        task.assignees.some(
            (a: any) => (a.userId || a.user?.id || a.id) === currentUser?.id
        );
    const canManageTasks = permissions.canManageTasks;
    const isProjectMember = permissions.isProjectMember || isAssignedToMainTask;
    const canCreateSubtask = isProjectMember;

    // Build candidate assignees for subtasks:
    // If manager/leader: main task squad + manager/leader
    // If regular member: strictly for themselves
    const candidateAssignees: any[] = [];
    const addedIds = new Set<string>();

    if (canManageTasks) {
        if (Array.isArray(task?.assignees)) {
            task.assignees.forEach((a: any) => {
                const userObj = a.user || a;
                const id = userObj.id || a.userId;
                if (id && !addedIds.has(id)) {
                    addedIds.add(id);
                    candidateAssignees.push({
                        id,
                        name: userObj.name || userObj.fullName || "User",
                        avatarUrl: userObj.avatarUrl || null,
                    });
                }
            });
        }

        if (currentUser?.id && !addedIds.has(currentUser.id)) {
            candidateAssignees.push({
                id: currentUser.id,
                name: `${currentUser.name || "Me"} (You)`,
                avatarUrl: currentUser.avatarUrl || null,
            });
        }
    } else if (currentUser?.id) {
        candidateAssignees.push({
            id: currentUser.id,
            name: `${currentUser.name || "Me"} (You)`,
            avatarUrl: currentUser.avatarUrl || null,
        });
    }

    // Options for member filter dropdown using CustomSelect
    const assigneeOptions: SelectOption[] = React.useMemo(() => {
        const list: SelectOption[] = [
            {
                value: "",
                label: "All Assignees",
            },
        ];

        (task?.assignees || []).forEach((a: any) => {
            const userObj = a.user || a;
            const uid = userObj.id || a.userId;
            const name = userObj.name || userObj.fullName || "Member";
            const avatarUrl = userObj.avatarUrl || a.avatarUrl;
            if (uid && !list.some((item) => item.value === uid)) {
                list.push({
                    value: uid,
                    label: name,
                    avatarUrl: avatarUrl || null,
                });
            }
        });

        return list;
    }, [task?.assignees]);

    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const handleScrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
        }
    };

    const handleScrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
        }
    };

    const loadProjectDetail = React.useCallback(async () => {
        await refreshProject();
    }, [refreshProject]);

    const [localColumns, setLocalColumns] = useState<ColumnDef[]>([]);

    useEffect(() => {
        if (project?.columns && project.columns.length > 0) {
            setLocalColumns([...project.columns].sort((a, b) => a.order - b.order));
        } else {
            setLocalColumns(DEFAULT_SUBTASK_COLUMNS);
        }
    }, [project?.columns]);

    const columns: ColumnDef[] = localColumns.length > 0 ? localColumns : (project?.columns || DEFAULT_SUBTASK_COLUMNS);

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [columns, subtasks]);

    // Helper: Map subtask to a column ID
    const getSubtaskColumnId = (st: any): string => {
        // 1. If explicit columnId is stored on the subtask, match it directly!
        if (st.columnId) {
            const matchingCol = columns.find((c) => c.id === st.columnId);
            if (matchingCol) return matchingCol.id;
        }
        // 2. If subtask is marked completed, put in the completed column
        if (st.isCompleted) {
            const doneCol = columns.find((c) => c.isComplete || c.name.toLowerCase().includes("done") || c.name.toLowerCase().includes("completed"));
            if (doneCol) return doneCol.id;
        }
        // 3. Status name matching fallback
        if (st.status) {
            const matchingByName = columns.find(
                (c) => c.name.toLowerCase().trim() === st.status.toLowerCase().trim()
            );
            if (matchingByName) return matchingByName.id;
        }
        // 4. Default to first column on board
        return columns[0]?.id || "col-todo";
    };

    // Filter subtasks by member and date if selected
    const filteredSubtasks = subtasks.filter((st) => {
        if (memberFilter) {
            const assigneeId = st.assignedToId || st.assignedTo?.id;
            if (assigneeId !== memberFilter) return false;
        }
        if (dateFilterMode === "day") {
            if (!isSubtaskActiveOnDate(st, selectedDate)) return false;
        }
        return true;
    });

    // Drag and drop handler with @hello-pangea/dnd (Supports both subtasks and horizontal columns)
    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId, type } = result;
        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Horizontal column reordering
        if (type === "COLUMN") {
            if (!canManageTasks) return;

            const updatedCols = Array.from(columns);
            const [movedCol] = updatedCols.splice(source.index, 1);
            updatedCols.splice(destination.index, 0, movedCol);

            // Optimistic UI update
            setLocalColumns(updatedCols);

            const columnOrders = updatedCols.map((c, idx) => ({
                id: c.id,
                order: idx,
            }));

            try {
                // Silently persist new order to database
                await api.reorderProjectColumns(projectId, columnOrders);
                loadProjectDetail();
            } catch (err: any) {
                toast.error(err.message || "Failed to save column order");
                if (project?.columns) {
                    setLocalColumns([...project.columns].sort((a, b) => a.order - b.order));
                }
            }
            return;
        }

        const targetColId = destination.droppableId;
        const targetCol = columns.find((c) => c.id === targetColId);
        if (!targetCol) return;

        const isTargetComplete = Boolean(targetCol.isComplete || targetCol.name.toLowerCase() === "completed");
        const isTargetReview = targetCol.name.toLowerCase().includes("review");

        // Optimistic local state update
        setSubtasks((prev) =>
            prev.map((st) => {
                if (st.id === draggableId) {
                    return {
                        ...st,
                        columnId: targetColId,
                        isCompleted: isTargetComplete,
                        acceptanceStatus: isTargetReview ? "PENDING" : "ACCEPTED",
                        status: isTargetComplete
                            ? "Completed"
                            : isTargetReview
                            ? "InReview"
                            : targetCol.name.toLowerCase().includes("progress")
                            ? "InProgress"
                            : "Backlog",
                    };
                }
                return st;
            })
        );

        if (isTargetComplete) {
            triggerMicroCelebration({ intensity: "medium" });
            playFeedback();
        }

        try {
            await api.updateProjectSubtask(projectId, taskId, draggableId, {
                columnId: targetColId,
                isCompleted: isTargetComplete,
                acceptanceStatus: isTargetReview ? "PENDING" : "ACCEPTED",
            });
            toast.success(`Moved to ${targetCol.name}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to move subtask");
            loadProjectDetail();
        }
    };

    // Toggle completion directly from card checkbox
    const handleToggleComplete = async (st: any) => {
        const nextComplete = !st.isCompleted;

        setSubtasks((prev) =>
            prev.map((s) => (s.id === st.id ? { ...s, isCompleted: nextComplete } : s))
        );

        if (nextComplete) {
            triggerMicroCelebration({ intensity: "subtle" });
            playFeedback();
        }

        try {
            await api.updateProjectSubtask(projectId, taskId, st.id, {
                isCompleted: nextComplete,
            });
            toast.success(`Subtask marked as ${nextComplete ? "completed" : "incomplete"}`);
            loadProjectDetail();
        } catch (err: any) {
            toast.error(err.message || "Failed to update subtask");
            loadProjectDetail();
        }
    };

    // Reassign subtask to new member
    const handleReassignSubtask = async (subtaskId: string, newAssigneeId: string) => {
        try {
            await api.updateProjectSubtask(projectId, taskId, subtaskId, {
                assignedToId: newAssigneeId,
            });
            toast.success("Subtask reassigned");
            loadProjectDetail();
        } catch (err: any) {
            toast.error(err.message || "Failed to reassign subtask");
        }
    };

    // Delete subtask
    const handleDeleteSubtask = async (subtaskId: string) => {
        if (!window.confirm("Are you sure you want to delete this subtask?")) return;
        try {
            await api.deleteProjectSubtask(projectId, taskId, subtaskId);
            toast.success("Subtask deleted");
            loadProjectDetail();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete subtask");
        }
    };

    // Column Management: Add / Edit / Safe Delete
    const handleSaveColumn = async (name: string, type = "CUSTOM", isComplete = false) => {
        if (columnModalInitialData?.id) {
            // Update existing column
            await api.updateProjectColumn(projectId, columnModalInitialData.id, {
                name,
                isComplete,
            });
            toast.success("Column updated");
        } else {
            // Create new column
            await api.createProjectColumn(projectId, name, type, isComplete);
            toast.success("Column added");
        }
        loadProjectDetail();
    };

    const handleDeleteColumn = async (col: ColumnDef) => {
        if (isSystemColumn(col)) {
            toast.error("Core system workflow stages cannot be deleted.");
            return;
        }

        if (columns.length <= 1) {
            toast.error("Cannot delete the only remaining column.");
            return;
        }

        const subtasksInThisCol = subtasks.filter((st) => getSubtaskColumnId(st) === col.id);
        const fallbackCol = columns.find((c) => c.id !== col.id) || DEFAULT_SUBTASK_COLUMNS[0];

        const confirmMsg =
            subtasksInThisCol.length > 0
                ? `Column "${col.name}" contains ${subtasksInThisCol.length} subtasks. Moving them to "${fallbackCol.name}" before deleting. Proceed?`
                : `Are you sure you want to delete column "${col.name}"?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            // If subtasks exist, migrate them to fallback column
            if (subtasksInThisCol.length > 0) {
                await Promise.all(
                    subtasksInThisCol.map((st) =>
                        api.updateProjectSubtask(projectId, taskId, st.id, {
                            columnId: fallbackCol.id,
                            isCompleted: Boolean(fallbackCol.isComplete),
                        })
                    )
                );
            }

            await api.deleteProjectColumn(projectId, col.id);
            toast.success(
                subtasksInThisCol.length > 0
                    ? `Column deleted. ${subtasksInThisCol.length} subtasks moved to ${fallbackCol.name}.`
                    : "Column deleted successfully."
            );
            loadProjectDetail();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete column");
        }
    };

    if (isLoading && !project) {
        return <ProjectSubtaskDetailSkeleton />;
    }

    if (!project || !task) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-[var(--app-bg)]">
                <div className="text-center flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-[var(--app-text)]">
                        Task Not Found
                    </h2>
                    <p className="text-sm text-[var(--app-muted)]">
                        The task you requested does not exist or has been deleted.
                    </p>
                    <Link
                        href={`/projects/${projectId}`}
                        className="text-[11px] text-[var(--app-text)] underline hover:no-underline"
                    >
                        ← Back to Project Board
                    </Link>
                </div>
            </div>
        );
    }

    const columnMap: Record<string, any> = {};
    columns.forEach((c) => { columnMap[c.id] = c; });
    const completedCount = subtasks.filter((s) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;
    const progressPct = calculateTaskProgress(task, columnMap);

    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)] text-[var(--app-text)]">
            {/* Top Navigation & Task Meta Header */}
            <div className="shrink-0 px-5 py-3.5 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-col gap-3">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--app-muted)]">
                    <Link href="/projects" className="hover:text-[var(--app-text)] transition-colors">
                        Projects
                    </Link>
                    <ChevronRight className="w-3 h-3 text-[var(--app-muted)]" />
                    <Link
                        href={`/projects/${project.id}`}
                        className="hover:text-[var(--app-text)] transition-colors truncate max-w-[180px]"
                    >
                        {project.title || project.name}
                    </Link>
                    <ChevronRight className="w-3 h-3 text-[var(--app-muted)]" />
                    <span className="font-medium text-[var(--app-text)] truncate max-w-[220px]">
                        {task.title}
                    </span>
                </div>

                {/* Task Identity & Context Group */}
                <div className="flex flex-col gap-2">
                    {/* Task Title Row (Left: Back + Title; Right: Priority + Edit Task) */}
                    <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href={`/projects/${project.id}`}
                                className="p-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[2px] transition-colors shrink-0"
                                title="Back to Project Board"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <h1 className="text-lg font-semibold tracking-tight text-[var(--app-text)] truncate">
                                {task.title}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {(task.riskLevel === "AT_RISK" || task.riskLevel === "AtRisk") && (
                                <span className="text-[9px] text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-1.5 py-0.5 rounded-[2px] flex items-center gap-1 shrink-0">
                                    <AlertTriangle className="w-2.5 h-2.5" /> At Risk
                                </span>
                            )}
                            {(task.riskLevel === "OVERDUE" || task.riskLevel === "Overdue" || task.riskLevel === "CriticalSLA") && (
                                <span className="text-[9px] text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-1.5 py-0.5 rounded-[2px] flex items-center gap-1 shrink-0">
                                    <ShieldAlert className="w-2.5 h-2.5" /> Overdue
                                </span>
                            )}
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border shrink-0 ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                            </span>
                            {canManageTasks && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditMainTaskModalOpen(true)}
                                    className="px-2.5 py-1 text-[10px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                >
                                    <Edit2 className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Edit Task</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Task Metadata Row (Left: Dates & Main Task Squad; Right: Subtasks Progress below priority & edit) */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-4 text-[var(--app-muted)] flex-wrap">
                            {task.startDate && task.dueDate && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-[var(--app-muted)]" /> {formatDate(task.startDate)} → {formatDate(task.dueDate)}
                                </span>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span>Main Task Squad:</span>
                                <div className="flex -space-x-1">
                                    {(task.assignees || []).map((u: any, idx: number) => {
                                        const userObj = u.user || u;
                                        const name = userObj.name || userObj.fullName || "User";
                                        const avatarUrl = userObj.avatarUrl || u.avatarUrl;
                                        return (
                                            <UserAvatar
                                                key={userObj.id || idx}
                                                name={name}
                                                avatarUrl={avatarUrl}
                                                size="xs"
                                                title={name}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Subtasks Progress */}
                        <div className="flex items-center gap-2 text-[10px] shrink-0">
                            <span className="text-[var(--app-muted)]">Subtasks:</span>
                            <div className="w-24 h-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[1px] overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-success)] transition-all"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <span className="font-semibold text-[var(--app-text)] tabular-nums">
                                {completedCount}/{subtasks.length} ({progressPct}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Subtask Controls Bar (Filter Controls & Actions) */}
                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[var(--app-border)]/60 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
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
                                        title={isPrevDisabled ? "Reached task start date" : "Previous Day"}
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>

                                    <CustomDatePicker
                                        value={selectedDate}
                                        onChange={(val) => setSelectedDate(val)}
                                        minDate={taskStartDate}
                                        maxDate={taskDueDate}
                                        buttonClassName="border-0 shadow-none bg-transparent hover:bg-[var(--app-hover-bg)] h-full py-0 px-2 text-[10px] font-medium"
                                        className="w-28 h-full flex items-center"
                                    />

                                    <button
                                        type="button"
                                        onClick={handleNextDay}
                                        disabled={isNextDisabled}
                                        className="h-full px-1 flex items-center justify-center text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] disabled:opacity-25 disabled:cursor-not-allowed rounded-[2px] transition-colors cursor-pointer"
                                        title={isNextDisabled ? "Reached task due date" : "Next Day"}
                                    >
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Filter by Member (using CustomSelect with UserAvatars) */}
                        <CustomSelect
                            options={assigneeOptions}
                            value={memberFilter}
                            onChange={setMemberFilter}
                            placeholder="All Assignees"
                            buttonClassName="corner-brackets-4 text-[10px] h-[28px] py-0 bg-[var(--app-card)] min-w-[130px]"
                            className="w-38 h-[28px] shrink-0"
                        />
                    </div>

                    {/* Primary CTA: New Subtask Button */}
                    {canCreateSubtask && (
                        <button
                            type="button"
                            onClick={() => {
                                setSubtaskModalData(null);
                                setSubtaskModalInitialColStatus(columns[0]?.id || columns[0]?.name || "To Do");
                                setIsSubtaskModalOpen(true);
                            }}
                            className="h-[28px] relative corner-brackets-4 px-3.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                            title="Create a new subtask breakdown"
                        >
                            <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                            <span>New Subtask</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Kanban Columns Grid with DragDropContext */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="board-columns" direction="horizontal" type="COLUMN">
                    {(columnsDroppableProvided) => (
                        <div
                            ref={(el) => {
                                columnsDroppableProvided.innerRef(el);
                                (scrollContainerRef as any).current = el;
                            }}
                            {...columnsDroppableProvided.droppableProps}
                            onScroll={checkScroll}
                            className="flex-1 p-4 flex gap-4 overflow-x-auto overflow-y-hidden"
                        >
                            {columns.map((col, colIndex) => {
                                const colSubtasks = filteredSubtasks.filter(
                                    (st) => getSubtaskColumnId(st) === col.id
                                );
                                const isDoneCol = Boolean(col.isComplete || col.name.toLowerCase().includes("done") || col.name.toLowerCase().includes("completed"));
                                const isProgressCol = col.name.toLowerCase().includes("progress") || col.name.toLowerCase().includes("doing");
                                const isReviewCol = col.name.toLowerCase().includes("review") || col.name.toLowerCase().includes("qa");

                                const colAccent = isDoneCol
                                    ? "border-t-2 border-t-[var(--status-completed,#15803D)]"
                                    : isProgressCol
                                    ? "border-t-2 border-t-[var(--status-in-progress,#7C3AED)]"
                                    : isReviewCol
                                    ? "border-t-2 border-t-[var(--status-at-risk,#D97706)]"
                                    : "border-t-2 border-t-[var(--status-todo,#6B7280)]";

                                const stageMeta = getStageMeta(col);

                                return (
                                    <Draggable
                                        key={col.id}
                                        draggableId={col.id}
                                        index={colIndex}
                                        isDragDisabled={!canManageTasks}
                                    >
                                        {(columnDraggableProvided, columnSnapshot) => (
                                            <div
                                                ref={columnDraggableProvided.innerRef}
                                                {...columnDraggableProvided.draggableProps}
                                                className={`w-72 sm:w-80 shrink-0 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-3 max-h-full ${colAccent} ${
                                                    columnSnapshot.isDragging ? "shadow-2xl opacity-90 ring-1 ring-[var(--app-border-strong)] z-50" : ""
                                                }`}
                                            >
                                                {/* Column Header */}
                                                <div
                                                    {...columnDraggableProvided.dragHandleProps}
                                                    className={`flex items-center justify-between pb-2 border-b border-[var(--app-border)] select-none ${
                                                        canManageTasks ? "cursor-grab active:cursor-grabbing" : ""
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {canManageTasks && (
                                                            <span title="Drag to reorder column">
                                                                <GripVertical className="w-3.5 h-3.5 text-[var(--app-muted)] hover:text-[var(--app-text)] shrink-0" />
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] font-semibold text-[var(--app-text)] truncate">
                                                            {col.name}
                                                        </span>
                                                        <span className="text-[8px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-1 py-0.2 rounded-[1px] tabular-nums shrink-0" title={`Stage weight: ${stageMeta.weight}%`}>
                                                            {stageMeta.weight}%
                                                        </span>
                                                        <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] tabular-nums shrink-0">
                                                            {colSubtasks.length}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
                                                        {canCreateSubtask && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSubtaskModalData(null);
                                                                    setSubtaskModalInitialColStatus(col.name);
                                                                    setIsSubtaskModalOpen(true);
                                                                }}
                                                                className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[2px] transition-colors cursor-pointer"
                                                                title={`Create subtask in ${col.name}`}
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        {/* Edit Column button (Managers / Leaders) */}
                                                        {canManageTasks && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setColumnModalInitialData(col);
                                                                    setIsColumnModalOpen(true);
                                                                }}
                                                                className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[2px] transition-colors cursor-pointer"
                                                                title={`Edit column ${col.name}`}
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Droppable Subtask Cards List */}
                                                <Droppable droppableId={col.id} type="SUBTASK">
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.droppableProps}
                                                            className={`flex-1 flex flex-col gap-2 overflow-y-auto min-h-[140px] transition-colors rounded-[2px] p-1 ${
                                                                snapshot.isDraggingOver
                                                                    ? "bg-[var(--app-bg)]/80 ring-1 ring-dashed ring-[var(--app-border-strong)]"
                                                                    : ""
                                                            }`}
                                                        >
                                                            {colSubtasks.length === 0 ? (
                                                                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border border-dashed border-[var(--app-border)] rounded-[2px] p-3 gap-1.5 min-h-[120px]">
                                                                    <Layers className="w-4 h-4 text-[var(--app-muted)]" />
                                                                    <span className="text-[10px] text-[var(--app-muted)]">
                                                                        {dateFilterMode === "day" ? "No subtasks on this day" : "No subtasks yet"}
                                                                    </span>
                                                                    {canCreateSubtask && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSubtaskModalData(null);
                                                                                setSubtaskModalInitialColStatus(col.name);
                                                                                setIsSubtaskModalOpen(true);
                                                                            }}
                                                                            className="text-[10px] text-[var(--app-text)] font-semibold underline hover:no-underline cursor-pointer"
                                                                        >
                                                                            + Add subtask
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                colSubtasks.map((st, idx) => (
                                                                    <SubtaskKanbanCard
                                                                        key={st.id}
                                                                        subtask={st}
                                                                        index={idx}
                                                                        currentUser={currentUser}
                                                                        canManageTasks={canManageTasks}
                                                                        candidateAssignees={candidateAssignees}
                                                                        onSelectSubtask={(sub) => {
                                                                            setSubtaskModalData(sub);
                                                                            setIsSubtaskModalOpen(true);
                                                                        }}
                                                                        onEditSubtask={(sub) => {
                                                                            setSubtaskModalData(sub);
                                                                            setIsSubtaskModalOpen(true);
                                                                        }}
                                                                        onDeleteSubtask={handleDeleteSubtask}
                                                                        onReassignSubtask={handleReassignSubtask}
                                                                        onToggleComplete={handleToggleComplete}
                                                                    />
                                                                ))
                                                            )}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {columnsDroppableProvided.placeholder}

                            {/* End-of-Board Ghost "Add Column" Card */}
                            {canManageTasks && (
                                <div
                                    onClick={() => {
                                        setColumnModalInitialData(null);
                                        setIsColumnModalOpen(true);
                                    }}
                                    className="w-72 sm:w-80 shrink-0 border-2 border-dashed border-[var(--app-border)] hover:border-[var(--app-border-strong)] hover:bg-[var(--app-hover-bg)] rounded-[3px] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[220px]"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[var(--app-card)] border border-[var(--app-border)] flex items-center justify-center text-[var(--app-muted)] shadow-2xs">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-[var(--app-muted)]">
                                        Add Stage Column
                                    </span>
                                    <span className="text-[10px] text-[var(--app-muted)] text-center">
                                        Add custom workflow stages to this project
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Update Main Task Modal */}
            <UpdateProjectTaskModal
                isOpen={isEditMainTaskModalOpen}
                onClose={() => setIsEditMainTaskModalOpen(false)}
                project={project}
                task={task}
                onRefresh={loadProjectDetail}
                onTaskDeleted={() => router.push(`/projects/${projectId}`)}
            />

            {/* Add / Edit Project Column Modal */}
            <ProjectColumnModal
                isOpen={isColumnModalOpen}
                onClose={() => {
                    setIsColumnModalOpen(false);
                    setColumnModalInitialData(null);
                }}
                onSave={handleSaveColumn}
                onDelete={handleDeleteColumn}
                initialData={columnModalInitialData}
            />

            {/* Full Subtask Modal (Create & Edit) */}
            <ProjectSubtaskModal
                isOpen={isSubtaskModalOpen}
                onClose={() => {
                    setIsSubtaskModalOpen(false);
                    setSubtaskModalData(null);
                }}
                projectId={projectId}
                parentTask={task}
                subtask={subtaskModalData}
                columns={columns}
                initialColumnStatus={subtaskModalInitialColStatus}
                currentUser={currentUser}
                canManageTasks={canManageTasks}
                candidateAssignees={candidateAssignees}
                onRefresh={loadProjectDetail}
            />

            {/* Fixed Bottom Right Floating Board Scroll Controls */}
            {(canScrollLeft || canScrollRight) && (
                <div className="fixed bottom-6 right-6 z-40 flex items-center gap-0.5 p-1 bg-[var(--app-card)]/90 backdrop-blur-md border border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[3px] shadow-lg transition-all animate-fade-in select-none">
                    <button
                        type="button"
                        onClick={handleScrollLeft}
                        disabled={!canScrollLeft}
                        className="p-1.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed rounded-[2px] transition-colors cursor-pointer"
                        title="Scroll board left"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-px h-3.5 bg-[var(--app-border)]" />
                    <button
                        type="button"
                        onClick={handleScrollRight}
                        disabled={!canScrollRight}
                        className="p-1.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] disabled:opacity-30 disabled:cursor-not-allowed rounded-[2px] transition-colors cursor-pointer"
                        title="Scroll board right"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
