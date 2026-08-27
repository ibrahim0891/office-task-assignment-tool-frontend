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
import { SubtaskKanbanCard } from "./SubtaskKanbanCard";

function getInitials(name: string) {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

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
    const { currentUser, userRole } = useWorkspace();

    const [project, setProject] = useState<any>(null);
    const [task, setTask] = useState<any>(null);
    const [subtasks, setSubtasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isEditMainTaskModalOpen, setIsEditMainTaskModalOpen] = useState(false);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [columnModalInitialData, setColumnModalInitialData] = useState<any | null>(null);
    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
    const [subtaskModalData, setSubtaskModalData] = useState<any | null>(null);
    const [subtaskModalInitialColStatus, setSubtaskModalInitialColStatus] = useState("Backlog");

    // Quick add inline in column
    const [addingInColId, setAddingInColId] = useState<string | null>(null);
    const [quickTitle, setQuickTitle] = useState("");
    const [quickAssigneeId, setQuickAssigneeId] = useState("");
    const [quickEstDays, setQuickEstDays] = useState(1);

    // Filters
    const [memberFilter, setMemberFilter] = useState<string>("");

    // Active column menu dropdown
    const [activeColMenuId, setActiveColMenuId] = useState<string | null>(null);

    const currentProjectMember = (project?.members || []).find(
        (m: any) => m.userId === currentUser?.id || m.user?.id === currentUser?.id
    );
    const isProjectManager =
        project?.managerId === currentUser?.id ||
        project?.manager?.id === currentUser?.id ||
        (currentProjectMember?.role || "").toUpperCase() === "MANAGER" ||
        userRole === "LEADER";
    const isProjectLeader =
        isProjectManager ||
        (currentProjectMember?.role || "").toUpperCase() === "LEADER";
    const canManageTasks = isProjectManager || isProjectLeader;

    const isAssignedToMainTask =
        Array.isArray(task?.assignees) &&
        task.assignees.some(
            (a: any) => (a.userId || a.user?.id || a.id) === currentUser?.id
        );

    const canCreateSubtask = canManageTasks || isAssignedToMainTask;

    // Build candidate assignees for subtasks: squad members + manager/leader
    const candidateAssignees: any[] = [];
    const addedIds = new Set<string>();

    if (Array.isArray(task?.assignees)) {
        task.assignees.forEach((a: any) => {
            const userObj = a.user || a;
            const id = userObj.id || a.userId;
            if (id && !addedIds.has(id)) {
                addedIds.add(id);
                candidateAssignees.push({
                    id,
                    name: userObj.name || userObj.fullName || "User",
                });
            }
        });
    }

    if (currentUser?.id && !addedIds.has(currentUser.id)) {
        candidateAssignees.push({
            id: currentUser.id,
            name: `${currentUser.name || "Me"} (You)`,
        });
    }

    const loadProjectDetail = async () => {
        if (!projectId || !taskId) return;
        try {
            const data = await api.getProjectDetail(projectId);
            setProject(data);
            const foundTask = (data.tasks || []).find((t: any) => t.id === taskId);
            setTask(foundTask);
            setSubtasks(foundTask?.subtasks || []);
            if (foundTask?.assignees && foundTask.assignees.length > 0 && !quickAssigneeId) {
                const firstAssignee = foundTask.assignees[0];
                setQuickAssigneeId(
                    firstAssignee.userId || firstAssignee.user?.id || firstAssignee.id
                );
            }
        } catch (err) {
            console.error("Failed to load project details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjectDetail();
    }, [projectId, taskId]);

    // Real-time listener: Update subtask card comment counts when comments are posted/deleted
    useEffect(() => {
        const handleCommentCreated = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { subtaskId, comment } = customEvent.detail || {};
            if (subtaskId) {
                setSubtasks((prev) =>
                    prev.map((st) => {
                        if (st.id === subtaskId) {
                            const existingComments = Array.isArray(st.comments) ? st.comments : [];
                            const updatedComments = comment && existingComments.some((c: any) => c.id === comment?.id)
                                ? existingComments
                                : comment ? [...existingComments, comment] : existingComments;
                            return {
                                ...st,
                                comments: updatedComments,
                                commentsCount: (st.commentsCount || existingComments.length || 0) + 1,
                            };
                        }
                        return st;
                    })
                );
            }
        };

        const handleCommentDeleted = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { subtaskId, commentId } = customEvent.detail || {};
            if (subtaskId) {
                setSubtasks((prev) =>
                    prev.map((st) => {
                        if (st.id === subtaskId) {
                            const existingComments = Array.isArray(st.comments) ? st.comments : [];
                            const updatedComments = existingComments.filter((c: any) => c.id !== commentId);
                            return {
                                ...st,
                                comments: updatedComments,
                                commentsCount: Math.max(0, (st.commentsCount || existingComments.length || 1) - 1),
                            };
                        }
                        return st;
                    })
                );
            }
        };

        window.addEventListener("project_task_comment_created", handleCommentCreated);
        window.addEventListener("project_task_comment_deleted", handleCommentDeleted);
        return () => {
            window.removeEventListener("project_task_comment_created", handleCommentCreated);
            window.removeEventListener("project_task_comment_deleted", handleCommentDeleted);
        };
    }, []);

    // Compute board columns: project custom columns if available, or default subtask columns
    const columns: ColumnDef[] =
        project?.columns && project.columns.length > 0
            ? project.columns
            : DEFAULT_SUBTASK_COLUMNS;

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

    // Quick Add inline in column footer
    const handleOpenQuickAdd = (colId: string) => {
        setAddingInColId(colId);
        setQuickTitle("");
        setQuickEstDays(1);
        if (!canManageTasks) {
            setQuickAssigneeId(currentUser?.id || "");
        } else if (!quickAssigneeId || !candidateAssignees.some((c) => c.id === quickAssigneeId)) {
            setQuickAssigneeId(candidateAssignees[0]?.id || currentUser?.id || "");
        }
    };

    const handleQuickAddSubmit = async (col: ColumnDef) => {
        if (!quickTitle.trim()) {
            toast.error("Please enter a subtask title");
            return;
        }

        let targetAssigneeId = quickAssigneeId;
        if (!canManageTasks) {
            targetAssigneeId = currentUser?.id || "";
        } else if (!targetAssigneeId) {
            targetAssigneeId = candidateAssignees[0]?.id || currentUser?.id || "";
        }

        if (!targetAssigneeId) {
            toast.error("No assignee available for this subtask.");
            return;
        }

        const isColComplete = Boolean(col.isComplete || col.name.toLowerCase() === "completed");

        try {
            await api.createProjectSubtask(projectId, taskId, {
                title: quickTitle.trim(),
                assignedToId: targetAssigneeId,
                startDate: task?.startDate || new Date(),
                dueDate: task?.dueDate || new Date(),
                estimatedDays: Number(quickEstDays) || 1,
                isCompleted: isColComplete,
                columnId: col.id,
            });
            toast.success("Subtask added successfully");
            setQuickTitle("");
            setAddingInColId(null);
            loadProjectDetail();
        } catch (err: any) {
            toast.error(err.message || "Failed to add subtask");
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

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-[var(--app-bg)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--app-muted)]" />
            </div>
        );
    }

    if (!project || !task) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-[var(--app-bg)]">
                <div className="text-center flex flex-col gap-3">
                    <h2 className="font-heading text-lg text-[var(--app-text)]">
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
                    <ChevronRight className="w-3 h-3" />
                    <Link
                        href={`/projects/${project.id}`}
                        className="hover:text-[var(--app-text)] transition-colors truncate max-w-[180px]"
                    >
                        {project.name}
                    </Link>
                    <ChevronRight className="w-3 h-3" />
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
                            <h1 className="font-heading text-lg font-semibold text-[var(--app-text)] truncate">
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

                    {/* Progress Bar & Member Filter */}
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

                        {/* Header Action: Add Column (Managers / Leaders) */}
                        {canManageTasks && (
                            <button
                                type="button"
                                onClick={() => {
                                    setColumnModalInitialData(null);
                                    setIsColumnModalOpen(true);
                                }}
                                className="relative corner-brackets-4 px-2.5 py-1 bg-[var(--app-bg)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-medium text-[10px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                                <Plus className="w-3 h-3" />
                                <span>Add Column</span>
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
                                    return (
                                        <div
                                            key={userObj.id || idx}
                                            className="w-4 h-4 rounded-full bg-[var(--app-card)] border border-[var(--app-border-strong)] flex items-center justify-center text-[7px] font-semibold text-[var(--app-text)]"
                                            title={name}
                                        >
                                            {getInitials(name)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Columns Grid with DragDropContext */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 p-4 flex gap-4 overflow-x-auto overflow-y-hidden">
                    {columns.map((col) => {
                        const colSubtasks = filteredSubtasks.filter(
                            (st) => getSubtaskColumnId(st) === col.id
                        );
                        const isDoneCol = Boolean(col.isComplete || col.name.toLowerCase() === "completed");

                        return (
                            <div
                                key={col.id}
                                className="w-72 sm:w-80 shrink-0 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-3 flex flex-col gap-3 max-h-full"
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between pb-2 border-b border-[var(--app-border)]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[11px] font-semibold text-[var(--app-text)] truncate">
                                            {col.name}
                                        </span>
                                        <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-full tabular-nums shrink-0">
                                            {colSubtasks.length}
                                        </span>
                                    </div>

                                    {/* Column Settings Menu (Managers / Leaders) */}
                                    {canManageTasks && (
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActiveColMenuId(
                                                        activeColMenuId === col.id ? null : col.id
                                                    )
                                                }
                                                className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer"
                                                title="Column settings"
                                            >
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                            </button>

                                            {activeColMenuId === col.id && (
                                                <div className="absolute right-0 top-6 z-50 w-36 bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-[2px] shadow-lg py-1 flex flex-col text-[10px] animate-fade-in">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveColMenuId(null);
                                                            setColumnModalInitialData(col);
                                                            setIsColumnModalOpen(true);
                                                        }}
                                                        className="w-full px-2.5 py-1.5 text-left text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Edit2 className="w-3 h-3 text-[var(--app-muted)]" />
                                                        <span>Edit Column</span>
                                                    </button>
                                                    {col.type === "CUSTOM" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveColMenuId(null);
                                                                handleDeleteColumn(col);
                                                            }}
                                                            className="w-full px-2.5 py-1.5 text-left text-[var(--color-error)] hover:bg-[var(--color-error)]/10 flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            <span>Delete Column</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                                <div className="text-center py-8 text-[var(--app-muted)] text-[10px] border border-dashed border-[var(--app-border)] rounded-[2px]">
                                                    No subtasks
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

                                {/* Column Footer: Quick Add Inline / Full Modal */}
                                {!isDoneCol && canCreateSubtask && (
                                    <div className="mt-auto pt-2 border-t border-[var(--app-border)]/60">
                                        {addingInColId === col.id ? (
                                            <div className="flex flex-col gap-2 p-2 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] animate-fade-in">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    placeholder="Subtask title..."
                                                    value={quickTitle}
                                                    onChange={(e) => setQuickTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleQuickAddSubmit(col);
                                                        }
                                                    }}
                                                    className="px-2 py-1 text-[10px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)] w-full"
                                                />
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    <div>
                                                        <label className="text-[8px] text-[var(--app-muted)] block mb-0.5">
                                                            Assignee
                                                        </label>
                                                        {canManageTasks ? (
                                                            <select
                                                                value={quickAssigneeId}
                                                                onChange={(e) =>
                                                                    setQuickAssigneeId(e.target.value)
                                                                }
                                                                className="w-full text-[9px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-1 text-[var(--app-text)] focus:outline-none cursor-pointer"
                                                            >
                                                                {candidateAssignees.map((a: any) => (
                                                                    <option key={a.id} value={a.id}>
                                                                        {a.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="w-full text-[9px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-1.5 py-1 text-[var(--app-text)] flex items-center gap-1">
                                                                <User className="w-2.5 h-2.5 text-[var(--app-muted)] shrink-0" />
                                                                <span className="truncate font-medium">
                                                                    {currentUser?.name || "You"} (Self)
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] text-[var(--app-muted)] block mb-0.5">
                                                            Est. Days
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0.25"
                                                            step="0.25"
                                                            value={quickEstDays}
                                                            onChange={(e) =>
                                                                setQuickEstDays(Number(e.target.value) || 1)
                                                            }
                                                            className="w-full text-[9px] bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] p-1 text-[var(--app-text)] focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-1.5 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddingInColId(null)}
                                                        className="px-2 py-0.5 border border-[var(--app-border)] text-[9px] text-[var(--app-muted)] rounded-[2px] hover:bg-[var(--app-hover-bg)] cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickAddSubmit(col)}
                                                        className="px-2 py-0.5 bg-[var(--app-card)] border border-[var(--app-border)] text-[9px] text-[var(--app-text)] font-medium rounded-[2px] hover:bg-[var(--app-hover-bg)] cursor-pointer"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenQuickAdd(col.id)}
                                                className="w-full flex items-center justify-center gap-1 py-1 text-[9px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] border border-dashed border-[var(--app-border)] rounded-[2px] transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add Subtask
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
