"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Calendar,
    CalendarRange,
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
    Filter,
    X,
    SlidersHorizontal,
    Search,
    ShieldCheck,
    Shield,
    Eye,
} from "lucide-react";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { triggerMicroCelebration } from "../../utils/confetti";
import { playFeedback } from "../../utils/feedback";
import UpdateProjectTaskModal from "./UpdateProjectTaskModal";
import ProjectColumnModal from "./ProjectColumnModal";
import ProjectSubtaskModal from "./ProjectSubtaskModal";
import TaskFilterModal from "./TaskFilterModal";
import { useProjectDetail } from "../../hooks/useProjectSWR";
import { SubtaskKanbanCard } from "./SubtaskKanbanCard";
import ProjectSubtaskDetailSkeleton from "./ProjectSubtaskDetailSkeleton";
import { UserAvatar } from "../ui/UserAvatar";
import { Button } from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { CustomSelect, SelectOption } from "../ui/CustomSelect";
import { calculateTaskProgress, isSystemColumn, getStageMeta } from "../../utils/projectProgress";
import { getProjectPermissions, canModifySubtask } from "../../utils/projectPermissions";
import { getLocalDateString, parseLocalDate, extractDateString, calculateDaySpan, formatDaySpan } from "../../utils/date";

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
    const searchParams = useSearchParams();
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
    const [subtaskModalInitialTab, setSubtaskModalInitialTab] = useState<"description" | "comments" | "activity" | "attachments">("description");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [subtaskToDelete, setSubtaskToDelete] = useState<{ id: string; title?: string } | null>(null);
    const [isDeletingSubtask, setIsDeletingSubtask] = useState(false);
    const [columnToDelete, setColumnToDelete] = useState<{ col: ColumnDef; fallbackCol: ColumnDef; subtaskCount: number } | null>(null);
    const [isDeletingColumn, setIsDeletingColumn] = useState(false);

    const subtaskIdParam = searchParams?.get("subtaskId") || searchParams?.get("subtask");
    const tabParam = searchParams?.get("tab");

    // Automatically open subtask modal with comment tab when directed from notification/URL
    useEffect(() => {
        if (!subtaskIdParam || !task?.subtasks || task.subtasks.length === 0) return;
        const targetSubtask = task.subtasks.find((s: any) => s.id === subtaskIdParam);
        if (targetSubtask) {
            setSubtaskModalData(targetSubtask);
            setSubtaskModalInitialTab(tabParam === "comments" ? "comments" : "description");
            setIsSubtaskModalOpen(true);
        }
    }, [subtaskIdParam, tabParam, task?.subtasks]);

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

    const [dateFilterMode, setDateFilterMode] = useState<"all" | "today" | "range">("all");
    const [rangeStartDate, setRangeStartDate] = useState<string>(() => taskStartDate || todayStr);
    const [rangeEndDate, setRangeEndDate] = useState<string>(() => taskDueDate || todayStr);
    const [priorityFilter, setPriorityFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        if (taskStartDate && !rangeStartDate) {
            setRangeStartDate(taskStartDate);
        }
        if (taskDueDate && !rangeEndDate) {
            setRangeEndDate(taskDueDate);
        }
    }, [taskStartDate, taskDueDate]);

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

    const isSubtaskActiveInRange = (st: any, startRange: string, endRange: string) => {
        if (!startRange && !endRange) return true;
        const stStart = extractDateString(st.startDate);
        const stDue = extractDateString(st.dueDate);

        // Subtask has both start and due dates
        if (stStart && stDue) {
            if (startRange && endRange) {
                return stStart <= endRange && stDue >= startRange;
            }
            if (startRange) return stDue >= startRange;
            if (endRange) return stStart <= endRange;
        }

        // Subtask only has due date
        if (stDue) {
            if (startRange && endRange) {
                return stDue >= startRange && stDue <= endRange;
            }
            if (startRange) return stDue >= startRange;
            if (endRange) return stDue <= endRange;
        }

        // Subtask only has start date
        if (stStart) {
            if (startRange && endRange) {
                return stStart >= startRange && stStart <= endRange;
            }
            if (startRange) return stStart >= startRange;
            if (endRange) return stStart <= endRange;
        }

        // If no dates set on subtask, include it
        return true;
    };

    const handleSetRangePreset = (preset: "task" | "week" | "7days" | "month" | "30days" | "project") => {
        const today = new Date();
        const todayFormatted = getLocalDateString(today);

        if (preset === "task" || preset === "project") {
            setRangeStartDate(taskStartDate || todayFormatted);
            setRangeEndDate(taskDueDate || todayFormatted);
        } else if (preset === "week") {
            const currentDay = today.getDay();
            const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diffToMonday);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            setRangeStartDate(getLocalDateString(monday));
            setRangeEndDate(getLocalDateString(sunday));
        } else if (preset === "7days") {
            const next7 = new Date(today);
            next7.setDate(today.getDate() + 6);
            setRangeStartDate(todayFormatted);
            setRangeEndDate(getLocalDateString(next7));
        } else if (preset === "30days") {
            const next30 = new Date(today);
            next30.setDate(today.getDate() + 29);
            setRangeStartDate(todayFormatted);
            setRangeEndDate(getLocalDateString(next30));
        } else if (preset === "month") {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setRangeStartDate(getLocalDateString(firstDay));
            setRangeEndDate(getLocalDateString(lastDay));
        }
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
    // If manager/leader: main task members + manager/leader
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
        try {
            const freshProject = await api.getProjectDetail(projectId, currentTeam?.id);
            if (freshProject) {
                refreshProject(freshProject, false);
                const freshTask = (freshProject.tasks || []).find((t: any) => t.id === taskId);
                if (freshTask?.subtasks) {
                    setSubtasks(freshTask.subtasks);
                }
            }
        } catch {
            await refreshProject();
        }
    }, [projectId, currentTeam?.id, taskId, refreshProject]);

    useEffect(() => {
        const handleProjectDataUpdated = async (e: any) => {
            const detail = e.detail;
            // Ignore socket re-fetch if this was our own subtask reorder event to prevent card flashing
            if (detail?.action === "subtask_reorder" && detail?.actingUserId && currentUser?.id && detail.actingUserId === currentUser.id) {
                return;
            }
            if (!detail || !detail.projectId || detail.projectId === projectId) {
                await loadProjectDetail();
            }
        };
        window.addEventListener("project_data_updated", handleProjectDataUpdated);
        return () => window.removeEventListener("project_data_updated", handleProjectDataUpdated);
    }, [projectId, currentUser?.id, loadProjectDetail]);

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

    const priorityOptions: SelectOption[] = [
        { value: "", label: "All Priorities" },
        { value: "URGENT", label: "Urgent" },
        { value: "HIGH", label: "High" },
        { value: "MEDIUM", label: "Medium" },
        { value: "LOW", label: "Low" },
    ];

    // Filter subtasks by search query, member, priority, and date (day or range)
    const filteredSubtasks = subtasks.filter((st) => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const titleMatch = (st.title || "").toLowerCase().includes(query);
            const descMatch = (st.description || "").toLowerCase().includes(query);
            if (!titleMatch && !descMatch) return false;
        }
        if (memberFilter) {
            const assigneeId = st.assignedToId || st.assignedTo?.id;
            if (assigneeId !== memberFilter) return false;
        }
        if (priorityFilter) {
            const stPriority = (st.priority || "MEDIUM").toUpperCase();
            if (stPriority !== priorityFilter.toUpperCase()) return false;
        }
        if (dateFilterMode === "today") {
            if (!isSubtaskActiveOnDate(st, todayStr)) return false;
        } else if (dateFilterMode === "range") {
            if (!isSubtaskActiveInRange(st, rangeStartDate, rangeEndDate)) return false;
        }
        return true;
    });

    const todaySubtasksCount = React.useMemo(() => {
        return subtasks.filter((st: any) => isSubtaskActiveOnDate(st, todayStr)).length;
    }, [subtasks, todayStr]);

    const modalFilterActiveCount =
        (dateFilterMode === "range" ? 1 : 0) +
        (priorityFilter ? 1 : 0);

    const activeFilterCount =
        (dateFilterMode !== "all" ? 1 : 0) +
        (memberFilter ? 1 : 0) +
        (priorityFilter ? 1 : 0) +
        (searchQuery.trim() !== "" ? 1 : 0);

    const handleClearAllFilters = () => {
        setDateFilterMode("all");
        setMemberFilter("");
        setPriorityFilter("");
        setSearchQuery("");
    };

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
            setLocalColumns(updatedCols);

            try {
                await api.reorderProjectColumns(
                    projectId,
                    updatedCols.map((c, idx) => ({ id: c.id, order: idx }))
                );
            } catch (err: any) {
                toast.error(err.message || "Failed to save column order");
                if (project?.columns) {
                    setLocalColumns([...project.columns].sort((a, b) => a.order - b.order));
                }
            }
            return;
        }

        // Subtask reordering / moving across columns
        const sourceColId = source.droppableId;
        const targetColId = destination.droppableId;
        const targetCol = columns.find((c) => c.id === targetColId);
        const draggedSubtask = subtasks.find((s) => s.id === draggableId);
        if (!targetCol || !draggedSubtask) return;

        const isMovingAcross = sourceColId !== targetColId;

        // Check permissions if moving across columns
        if (isMovingAcross && !canModifySubtask(draggedSubtask, currentUser, canManageTasks)) {
            toast.error("Only the assigned member, project leader, or manager can move this subtask to another column.");
            return;
        }

        const isTargetComplete = Boolean(targetCol.isComplete || targetCol.name.toLowerCase() === "completed");
        const isTargetReview = targetCol.name.toLowerCase().includes("review");

        let actualDaysPayload = draggedSubtask.actualDays;
        if (isMovingAcross) {
            if (isTargetComplete) {
                const startDateRef = draggedSubtask.startDate || draggedSubtask.createdAt || new Date();
                actualDaysPayload = calculateDaySpan(startDateRef, new Date());
            } else if (draggedSubtask.isCompleted) {
                actualDaysPayload = 0;
            }
        }

        const updatedSubtask = isMovingAcross
            ? {
                  ...draggedSubtask,
                  columnId: targetColId,
                  isCompleted: isTargetComplete,
                  actualDays: actualDaysPayload,
                  acceptanceStatus: isTargetReview ? "PENDING" : "ACCEPTED",
                  status: isTargetComplete
                      ? "Completed"
                      : isTargetReview
                      ? "InReview"
                      : targetCol.name.toLowerCase().includes("progress")
                      ? "InProgress"
                      : "Backlog",
              }
            : draggedSubtask;

        // 1. Target column list
        const targetList = subtasks
            .filter((st) => st.id !== draggableId && getSubtaskColumnId(st) === targetColId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        targetList.splice(destination.index, 0, updatedSubtask);

        const targetOrders = targetList.map((st, idx) => ({
            id: st.id,
            order: idx,
            columnId: targetColId,
        }));

        // 2. Source column list (if moved across columns)
        let sourceOrders: { id: string; order: number; columnId: string }[] = [];
        if (isMovingAcross) {
            const sourceList = subtasks
                .filter((st) => st.id !== draggableId && getSubtaskColumnId(st) === sourceColId)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            sourceOrders = sourceList.map((st, idx) => ({
                id: st.id,
                order: idx,
                columnId: sourceColId,
            }));
        }

        const allOrders = [...targetOrders, ...sourceOrders];
        const orderMap = new Map(allOrders.map((item) => [item.id, item.order]));

        // Optimistic UI state update
        setSubtasks((prev) =>
            prev.map((st) => {
                if (st.id === draggableId) {
                    return { ...updatedSubtask, order: destination.index };
                }
                if (orderMap.has(st.id)) {
                    return { ...st, order: orderMap.get(st.id)! };
                }
                return st;
            })
        );

        if (isMovingAcross && isTargetComplete) {
            triggerMicroCelebration({ intensity: "medium" });
            playFeedback("complete");
        } else {
            playFeedback("click");
        }

        // Persist to database
        try {
            if (isMovingAcross) {
                await api.updateProjectSubtask(projectId, taskId, draggableId, {
                    columnId: targetColId,
                    isCompleted: isTargetComplete,
                    actualDays: actualDaysPayload,
                    completedAt: isTargetComplete ? new Date().toISOString() : null,
                    acceptanceStatus: isTargetReview ? "PENDING" : "ACCEPTED",
                    order: destination.index,
                });
            }
            await api.reorderProjectSubtasks(projectId, taskId, allOrders);
        } catch (err: any) {
            toast.error(err.message || "Failed to update subtask order");
            loadProjectDetail();
        }
    };

    // Toggle completion directly from card checkbox
    const handleToggleComplete = async (st: any) => {
        const nextComplete = !st.isCompleted;
        const startDateRef = st.startDate || st.createdAt || new Date();
        const calculatedActual = nextComplete ? calculateDaySpan(startDateRef, new Date()) : 0;

        setSubtasks((prev) =>
            prev.map((s) => (s.id === st.id ? { ...s, isCompleted: nextComplete, actualDays: calculatedActual } : s))
        );

        if (nextComplete) {
            triggerMicroCelebration({ intensity: "subtle" });
            playFeedback();
        }

        try {
            await api.updateProjectSubtask(projectId, taskId, st.id, {
                isCompleted: nextComplete,
                actualDays: calculatedActual,
                completedAt: nextComplete ? new Date().toISOString() : null,
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
    const handleDeleteSubtask = (subtaskId: string) => {
        const found = subtasks.find((s: any) => s.id === subtaskId);
        setSubtaskToDelete(found || { id: subtaskId });
    };

    const handleConfirmDeleteSubtask = async () => {
        if (!subtaskToDelete) return;
        setIsDeletingSubtask(true);
        try {
            await api.deleteProjectSubtask(projectId, taskId, subtaskToDelete.id);
            toast.success("Subtask deleted");
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("project_data_updated", { detail: { projectId } }));
            }
            loadProjectDetail();
            setSubtaskToDelete(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete subtask");
        } finally {
            setIsDeletingSubtask(false);
        }
    };

    // Column Management: Add / Edit / Safe Delete
    const handleSaveColumn = async (name: string, type = "CUSTOM", isComplete = false) => {
        if (columnModalInitialData?.id) {
            // Update existing column
            await api.updateProjectColumn(projectId, columnModalInitialData.id, {
                name,
                type,
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

        setColumnToDelete({
            col,
            fallbackCol,
            subtaskCount: subtasksInThisCol.length,
        });
    };

    const handleConfirmDeleteColumn = async () => {
        if (!columnToDelete) return;
        const { col, fallbackCol, subtaskCount } = columnToDelete;

        try {
            setIsDeletingColumn(true);
            // If subtasks exist, migrate them to fallback column
            if (subtaskCount > 0) {
                const subtasksInThisCol = subtasks.filter((st) => getSubtaskColumnId(st) === col.id);
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
                subtaskCount > 0
                    ? `Column deleted. ${subtaskCount} subtasks moved to ${fallbackCol.name}.`
                    : "Column deleted successfully."
            );
            loadProjectDetail();
            setColumnToDelete(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete column");
        } finally {
            setIsDeletingColumn(false);
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
    const isTaskFullyComplete = progressPct === 100 || Boolean((task as any).isCompleted || task.status === "Done" || task.status === "Completed" || (subtasks.length > 0 && completedCount === subtasks.length));

    const isTaskOverdue = !isTaskFullyComplete && (
        task.riskLevel === "OVERDUE" || task.riskLevel === "Overdue" || task.riskLevel === "CriticalSLA" ||
        (task.dueDate && new Date(task.dueDate).getTime() < Date.now())
    );
    const isTaskAtRisk = !isTaskFullyComplete && !isTaskOverdue && (
        task.riskLevel === "AT_RISK" || task.riskLevel === "AtRisk"
    );

    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        return d.toISOString().split("T")[0];
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)] text-[var(--app-text)]">
            {/* Top Navigation & Task Meta Header */}
            <div className="shrink-0 px-5 py-3 border-b border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-between gap-4 select-none">
                {/* Left: Back Link to Project, Title, Status & Priority */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Link
                        href={`/projects/${project.id}`}
                        className="p-1.5 -ml-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] border border-transparent hover:border-[var(--app-border)] rounded-[4px] transition-colors shrink-0"
                        title={`Back to ${project.title || project.name}`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Link>

                    <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                        <h1
                            className="font-heading text-base sm:text-lg font-bold tracking-tight text-[var(--app-text)] truncate max-w-[280px] sm:max-w-[420px] lg:max-w-[600px]"
                            title={task.title}
                        >
                            {task.title}
                        </h1>

                        {/* Status / Completion Indicator next to Title */}
                        {isTaskFullyComplete ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--status-completed,#15803D)] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-completed,#15803D)]" />
                                <span>Completed</span>
                            </span>
                        ) : isTaskOverdue ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-error)] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-error)]" />
                                <span>At Risk</span>
                            </span>
                        ) : isTaskAtRisk ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--status-at-risk,#D97706)] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-at-risk,#D97706)]" />
                                <span>At Risk</span>
                            </span>
                        ) : progressPct > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--status-in-progress,#7C3AED)] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-in-progress,#7C3AED)]" />
                                <span>In Progress</span>
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--status-todo,#6B7280)] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-todo,#6B7280)]" />
                                <span>To Do</span>
                            </span>
                        )}

                        {/* Priority Badge */}
                        <span className="text-[11px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[3px] border border-[var(--app-border)] shrink-0" title={`Priority: ${task.priority}`}>
                            {task.priority || "Medium"}
                        </span>
                    </div>
                </div>

                {/* Right: Dates, Member Avatars, Progress & Edit Button */}
                <div className="flex items-center gap-3 shrink-0 text-xs text-[var(--app-muted)]">
                    {/* Timeline Date Range */}
                    {(task.startDate || task.dueDate) && (
                        <div
                            className="hidden md:flex items-center gap-1.5 bg-[var(--app-bg)] px-2.5 py-1 rounded-[3px] border border-[var(--app-border)] font-medium text-[11px]"
                            title={task.startDate && task.dueDate ? `Timeline: ${formatDate(task.startDate)} – ${formatDate(task.dueDate)} (${formatDaySpan(calculateDaySpan(task.startDate, task.dueDate))})` : "Task Timeline"}
                        >
                            <Calendar className="w-3 h-3 text-[var(--app-muted)] shrink-0" />
                            <span>{formatDate(task.startDate) || "—"}</span>
                            <span>–</span>
                            <span>{formatDate(task.dueDate) || "—"}</span>
                        </div>
                    )}

                    {/* Member Avatars */}
                    {task.assignees && task.assignees.length > 0 && (
                        <div className="hidden lg:flex items-center -space-x-1.5 shrink-0" title={`Members: ${task.assignees.map((a: any) => (a.user?.name || a.name || "User")).join(", ")}`}>
                            {(task.assignees || []).slice(0, 3).map((u: any, idx: number) => {
                                const userObj = u.user || u;
                                const name = userObj.name || userObj.fullName || "User";
                                const avatarUrl = userObj.avatarUrl || u.avatarUrl;
                                return (
                                    <div key={userObj.id || idx} className="ring-1.5 ring-[var(--app-card)] rounded-full">
                                        <UserAvatar
                                            name={name}
                                            avatarUrl={avatarUrl}
                                            size="xs"
                                            showBorder={false}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Subtasks Progress Gauge */}
                    <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--app-muted)] shrink-0" title="Subtask Completion Progress">
                        <span className="text-[11px] font-medium">Subtasks</span>
                        <div className="w-20 sm:w-28 h-1.5 bg-[var(--app-bg)] rounded-full border border-[var(--app-border)] overflow-hidden">
                            <div
                                className="h-full bg-[var(--status-completed,#15803D)] transition-all duration-300 rounded-full"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="font-semibold text-[var(--app-text)] tabular-nums text-[11px]">
                            {completedCount}/{subtasks.length}
                        </span>
                    </div>

                    {/* Edit Task Modal Button */}
                    {canManageTasks && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsEditMainTaskModalOpen(true)}
                            icon={<Edit2 className="w-3.5 h-3.5 text-[var(--app-muted)] shrink-0" />}
                            title="Edit Main Task"
                            className="shadow-2xs text-xs"
                        >
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Subtask Controls & Filters Bar */}
            <div className="shrink-0 px-5 py-2.5 border-b border-[var(--app-border)] bg-[var(--app-card)] flex flex-wrap items-center justify-between gap-3 select-none">
                {/* Left Side: Scope Toggle (All vs Today) + Add Subtask & Columns Buttons */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {/* Scope Segmented Toggle */}
                    <div className="flex items-center h-[32px] bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] p-0.5 text-xs font-medium shrink-0">
                        <button
                            type="button"
                            onClick={() => setDateFilterMode("all")}
                            className={`h-full px-3 rounded-[1px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                dateFilterMode === "all"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <span>All Subtasks</span>
                            <span className={`text-xs tabular-nums font-normal transition-colors ${
                                dateFilterMode === "all" ? "text-[var(--app-muted)]" : "text-[var(--app-muted)]/70"
                            }`}>
                                ({subtasks.length})
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setDateFilterMode("today")}
                            className={`h-full px-3 rounded-[1px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                                dateFilterMode === "today"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] font-semibold shadow-xs border border-[var(--app-border-strong)]"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            <span>Today</span>
                            {todaySubtasksCount > 0 && (
                                <span className={`text-xs tabular-nums font-normal transition-colors ${
                                    dateFilterMode === "today" ? "text-[var(--app-muted)]" : "text-[var(--app-muted)]/70"
                                }`}>
                                    ({todaySubtasksCount})
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Add Subtask Action Button */}
                    {canCreateSubtask && (
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => {
                                setSubtaskModalData(null);
                                setSubtaskModalInitialColStatus(columns[0]?.id || columns[0]?.name || "To Do");
                                setIsSubtaskModalOpen(true);
                            }}
                        >
                            Add Subtask
                        </Button>
                    )}

                    {/* Columns Management CTA */}
                    {canManageTasks && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<SlidersHorizontal className="w-3.5 h-3.5 text-[var(--app-muted)]" />}
                            onClick={() => {
                                setColumnModalInitialData(null);
                                setIsColumnModalOpen(true);
                            }}
                            title="Manage workflow columns"
                            className="shadow-2xs text-xs"
                        >
                            Columns
                        </Button>
                    )}
                </div>

                {/* Right Side: Search, Assignee Filter, Modal Filter & Reset */}
                <div className="flex items-center gap-2.5 flex-wrap min-w-0 justify-end ml-auto">
                    {/* Search Subtasks */}
                    <div className="relative w-44 sm:w-56 h-[32px] shrink-0">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search subtasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-[32px] bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] focus:border-[var(--app-border-strong)] rounded-[2px] pl-7 pr-3 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none transition-colors corner-brackets-4"
                        />
                    </div>

                    {/* Assignee / Member Filter */}
                    <CustomSelect
                        options={assigneeOptions}
                        value={memberFilter}
                        onChange={setMemberFilter}
                        placeholder="All Assignees"
                        buttonClassName="corner-brackets-4 text-xs h-[32px] !py-0 px-3 bg-[var(--app-card)]"
                        className="w-32 sm:w-40 h-[32px] shrink-0"
                    />

                    {/* Filter Modal Trigger Button */}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Filter className="w-3.5 h-3.5 text-[var(--app-muted)]" />}
                        onClick={() => setIsFilterModalOpen(true)}
                        className="shadow-2xs text-xs h-[32px]"
                    >
                        <span>Filters</span>
                        {modalFilterActiveCount > 0 && (
                            <span className="ml-1 bg-[var(--app-text)] text-[var(--app-card)] text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                                {modalFilterActiveCount}
                            </span>
                        )}
                    </Button>

                    {/* Active Date Range Tag (When Date Range is applied from Modal) */}
                    {dateFilterMode === "range" && (
                        <div className="flex items-center h-[32px] bg-[var(--app-card)] border border-[var(--app-border-strong)] text-[var(--app-text)] text-[11px] font-medium px-2.5 py-0.5 rounded-[2px] gap-1.5 shadow-2xs animate-fade-in shrink-0">
                            <CalendarRange className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            <span className="tabular-nums">
                                {rangeStartDate} → {rangeEndDate}
                            </span>
                            <button
                                type="button"
                                onClick={() => setDateFilterMode("all")}
                                className="text-[var(--app-muted)] hover:text-[var(--app-text)] p-0.5 ml-0.5 rounded-[1px] cursor-pointer"
                                title="Clear date range filter"
                            >
                                <X className="w-3 h-3" />
                            </button>
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
                            className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 animate-fade-in shrink-0 h-[32px]"
                            title="Reset all search, date, priority, and assignment filters"
                        >
                            Reset ({activeFilterCount})
                        </Button>
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
                                const colSubtasks = filteredSubtasks
                                    .filter((st) => getSubtaskColumnId(st) === col.id)
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
                                                                        {dateFilterMode === "today" ? "No subtasks for today" : dateFilterMode === "range" ? "No subtasks in date range" : "No subtasks yet"}
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
                                                                        isProjectMember={isProjectMember}
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
                    setSubtaskModalInitialTab("description");
                }}
                projectId={projectId}
                parentTask={task}
                project={project}
                subtask={subtaskModalData}
                columns={columns}
                initialColumnStatus={subtaskModalInitialColStatus}
                initialTab={subtaskModalInitialTab}
                currentUser={currentUser}
                canManageTasks={canManageTasks}
                candidateAssignees={candidateAssignees}
                onRefresh={loadProjectDetail}
            />

            {/* Subtask Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={Boolean(subtaskToDelete)}
                title="Delete Subtask"
                description={`Are you sure you want to permanently delete "${subtaskToDelete?.title || "this subtask"}"? This action cannot be undone.`}
                confirmText="Delete Subtask"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isDeletingSubtask}
                onConfirm={handleConfirmDeleteSubtask}
                onClose={() => setSubtaskToDelete(null)}
            />

            {/* Column Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={Boolean(columnToDelete)}
                title="Delete Column"
                description={
                    columnToDelete?.subtaskCount && columnToDelete.subtaskCount > 0
                        ? `Column "${columnToDelete.col.name}" contains ${columnToDelete.subtaskCount} subtasks. They will be moved to "${columnToDelete.fallbackCol.name}" before deleting. Proceed?`
                        : `Are you sure you want to delete column "${columnToDelete?.col.name}"?`
                }
                confirmText="Delete Column"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isDeletingColumn}
                onConfirm={handleConfirmDeleteColumn}
                onClose={() => setColumnToDelete(null)}
            />

            {/* Subtask Filters Modal (Priority & Date Range) */}
            <TaskFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Filter Subtasks"
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
                priorityOptions={priorityOptions}
                rangeStartDate={rangeStartDate}
                rangeEndDate={rangeEndDate}
                onRangeStartDateChange={(val) => {
                    setRangeStartDate(val);
                    setDateFilterMode("range");
                }}
                onRangeEndDateChange={(val) => {
                    setRangeEndDate(val);
                    setDateFilterMode("range");
                }}
                onSetRangePreset={(preset) => {
                    handleSetRangePreset(preset);
                    setDateFilterMode("range");
                }}
                windowPresetLabel="Task Window"
                minDate={taskStartDate}
                maxDate={taskDueDate}
                onApply={() => {
                    setDateFilterMode("range");
                    setIsFilterModalOpen(false);
                }}
                onClearAll={handleClearAllFilters}
                activeCount={modalFilterActiveCount}
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
