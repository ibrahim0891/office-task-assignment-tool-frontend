"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
    DragDropContext,
    Droppable,
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

    const currentProjectMember = (project?.members || []).find(
        (m: any) => m.userId === currentUser?.id || m.user?.id === currentUser?.id
    );
    const isOwningWorkspaceLeader =
        userRole === "LEADER" && currentTeam?.id === project?.teamId;
    const isProjectManager =
        project?.managerId === currentUser?.id ||
        project?.manager?.id === currentUser?.id ||
        (currentProjectMember?.role || "").toUpperCase() === "MANAGER";
    const isProjectLeader =
        isProjectManager ||
        isOwningWorkspaceLeader ||
        (currentProjectMember?.role || "").toUpperCase() === "LEADER";
    const canManageTasks = isProjectManager || isProjectLeader;
    const isAssignedToMainTask =
        Array.isArray(task?.assignees) &&
        task.assignees.some(
            (a: any) => (a.userId || a.user?.id || a.id) === currentUser?.id
        );
    const isProjectMember = Boolean(currentProjectMember) || isAssignedToMainTask || canManageTasks;
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

    // Compute board columns: project custom columns if available, or default subtask columns
    const columns: ColumnDef[] =
        project?.columns && project.columns.length > 0
            ? project.columns
            : DEFAULT_SUBTASK_COLUMNS;

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [columns, subtasks]);

    // Helper: Map subtask to a column ID
    const getSubtaskColumnId = (st: any): string => {
        if (st.isCompleted) {
            const doneCol = columns.find((c) => c.isComplete || c.name.toLowerCase() === "completed");
            return doneCol?.id || columns[columns.length - 1]?.id || "col-done";
        }
        if (st.acceptanceStatus === "PENDING" || st.status === "InReview" || st.status === "PendingAcceptance") {
            const reviewCol = columns.find((c) => c.name.toLowerCase().includes("review"));
            if (reviewCol) return reviewCol.id;
        }
        if (st.status === "InProgress" || st.status === "In Progress") {
            const progCol = columns.find((c) => c.name.toLowerCase().includes("progress"));
            if (progCol) return progCol.id;
        }
        if (st.columnId) {
            const matchingCol = columns.find((c) => c.id === st.columnId);
            if (matchingCol) return matchingCol.id;
        }
        // Default to first column
        return columns[0]?.id || "col-todo";
    };

    // Filter subtasks by member if selected
    const filteredSubtasks = subtasks.filter((st) => {
        if (!memberFilter) return true;
        const assigneeId = st.assignedToId || st.assignedTo?.id;
        return assigneeId === memberFilter;
    });

    // Drag and drop handler with @hello-pangea/dnd
    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
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
        if (col.type === "SYSTEM") {
            toast.error("Default core columns cannot be deleted.");
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

    const completedCount = subtasks.filter((s) => s.isCompleted || s.status === "Completed" || s.status === "Done").length;
    const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : (task.isCompleted ? 100 : 0);

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

                {/* Main Task Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href={`/projects/${project.id}`}
                            className="p-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[2px] transition-colors shrink-0"
                            title="Back to Project Board"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="min-w-0 flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-lg font-semibold tracking-tight text-[var(--app-text)] truncate">
                                {task.title}
                            </h1>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border shrink-0 ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                            </span>
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
                            {canManageTasks && (
                                <button
                                    type="button"
                                    onClick={() => setIsEditMainTaskModalOpen(true)}
                                    className="px-2.5 py-1 text-[10px] font-medium border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-1"
                                >
                                    <Edit2 className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Edit Task</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar & Member Filter & Action CTAs */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        <div className="flex items-center gap-2 text-[10px]">
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

                        {/* Filter by Member */}
                        <div className="flex items-center gap-1.5 border border-[var(--app-border)] px-2 py-1 rounded-[2px] bg-[var(--app-bg)] text-[10px]">
                            <ListFilter className="w-3 h-3 text-[var(--app-muted)]" />
                            <select
                                value={memberFilter}
                                onChange={(e) => setMemberFilter(e.target.value)}
                                className="bg-transparent text-[10px] text-[var(--app-text)] focus:outline-none cursor-pointer"
                            >
                                <option value="">All Assignees</option>
                                {(task.assignees || []).map((a: any) => {
                                    const userObj = a.user || a;
                                    const uid = userObj.id || a.userId;
                                    return (
                                        <option key={uid} value={uid}>
                                            {userObj.name || userObj.fullName || "Member"}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Scroll Affordance Controls */}
                        <div className="flex items-center gap-0.5 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-bg)] p-0.5">
                            <button
                                type="button"
                                onClick={handleScrollLeft}
                                disabled={!canScrollLeft}
                                className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:opacity-30 disabled:cursor-not-allowed rounded-[1px] transition-colors cursor-pointer"
                                title="Scroll left"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleScrollRight}
                                disabled={!canScrollRight}
                                className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:opacity-30 disabled:cursor-not-allowed rounded-[1px] transition-colors cursor-pointer"
                                title="Scroll right"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Primary CTA: New Subtask Button */}
                        {canCreateSubtask && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSubtaskModalData(null);
                                    setSubtaskModalInitialColStatus(columns[0]?.name || "To Do");
                                    setIsSubtaskModalOpen(true);
                                }}
                                className="relative corner-brackets-4 px-3.5 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                                title="Create a new subtask breakdown"
                            >
                                <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                                <span>New Subtask</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-Header: Dates & Squad Assignees */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--app-border)]/60 flex-wrap gap-2">
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
                </div>
            </div>

            {/* Kanban Columns Grid with DragDropContext */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex-1 p-4 flex gap-4 overflow-x-auto overflow-y-hidden"
                >
                    {columns.map((col) => {
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

                        return (
                            <div
                                key={col.id}
                                className={`w-72 sm:w-80 shrink-0 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-3 max-h-full ${colAccent}`}
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between pb-2 border-b border-[var(--app-border)]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[11px] font-semibold text-[var(--app-text)] truncate">
                                            {col.name}
                                        </span>
                                        <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] tabular-nums shrink-0">
                                            {colSubtasks.length}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
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
                                <Droppable droppableId={col.id}>
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
                                                    <span className="text-[10px] text-[var(--app-muted)]">No subtasks yet</span>
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
                        );
                    })}

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
                            <span className="text-xs font-semibold text-[var(--app-text)]">Add Column</span>
                            <span className="text-[10px] text-[var(--app-muted)] text-center">
                                Create custom subtask stage
                            </span>
                        </div>
                    )}
                </div>
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
        </div>
    );
}
