import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Task, TaskColumn, User, api } from "../api";
import { triggerMicroCelebration } from "../utils/confetti";
import { CustomSelect } from "./ui/CustomSelect";
import { Checkbox } from "./ui/Checkbox";
import ConfirmDialog from "./ui/ConfirmDialog";
import { UserAvatar } from "./ui/UserAvatar";
import { useWorkspace } from "../context/WorkspaceContext";
import { APP_CONFIG } from "../config/appConfig";
import { getLocalDateString, parseLocalDate, extractDateString } from "../utils/date";
import {
    Trash2,
    Download,
    ChevronDown,
    ChevronRight,
    Check,
    CheckCircle2,
    MessageSquare,
    Paperclip,
    Search,
    X,
    ListTodo,
    AlertTriangle,
    Calendar,
    Plus,
    RotateCw,
    CornerDownLeft,
    Loader2,
} from "lucide-react";

interface ListViewProps {
    tasks: Task[];
    columns: TaskColumn[];
    teamMembers: { user: User; role: string }[];
    currentUser: User;
    currentTeam: { id: string };
    onRefresh: () => void;
    onSelectTask: (taskId: string) => void;
}

type SortField = "title" | "status" | "priority" | "dueDate";
type SortOrder = "asc" | "desc";
type FilterPreset = "all" | "overdue" | "today" | "urgent" | "carried";
type GroupByField = "none" | "status" | "priority" | "dueDate" | "assignee";
type PopoverType = "status" | "priority" | "due";

const PRIORITY_CFG: Record<string, { label: string; dot: string; pill: string }> = {
    URGENT: { label: "Urgent", dot: "bg-[#CB2431]", pill: "bg-[#CB2431]/10 border-[#CB2431]/20 text-[#CB2431]" },
    HIGH: { label: "High", dot: "bg-[#B08800]", pill: "bg-[#B08800]/10 border-[#B08800]/20 text-[#B08800]" },
    MEDIUM: { label: "Medium", dot: "bg-[var(--app-muted,#888883)]", pill: "bg-[var(--app-bg,#FAFAF9)] border-[var(--app-border,#E5E5E3)] text-[var(--app-text,#1A1A1A)]" },
    LOW: { label: "Low", dot: "bg-[var(--app-border,#E5E5E3)]", pill: "bg-[var(--app-bg,#FAFAF9)] border-[var(--app-border,#E5E5E3)] text-[var(--app-muted,#888883)]" },
};

const PRIORITY_OPTIONS = [
    { value: "URGENT", label: "Urgent" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
];

const DUE_TONE_CLS: Record<string, string> = {
    overdue: "text-[var(--color-danger,#CB2431)] bg-[var(--color-danger,#CB2431)]/10 border-[var(--color-danger,#CB2431)]/25 font-semibold",
    today: "text-[var(--color-warning,#B08800)] bg-[var(--color-warning,#B08800)]/10 border-[var(--color-warning,#B08800)]/25 font-semibold",
    soon: "text-[var(--app-text,#1A1A1A)] border-transparent",
    normal: "text-[var(--app-text,#1A1A1A)] border-transparent",
    done: "text-[var(--app-muted,#888883)] border-transparent",
};

/** Returns a YYYY-MM-DD string shifted by `days` from `base`. */
function shiftDate(base: string, days: number) {
    const d = parseLocalDate(base);
    d.setDate(d.getDate() + days);
    return getLocalDateString(d);
}

function formatHint(dateStr: string) {
    return parseLocalDate(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Close a popover/menu when clicking outside of `ref`. */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, active: boolean, onClose: () => void) {
    useEffect(() => {
        if (!active) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ref, active, onClose]);
}

function PortalMenu({
    rect,
    menuRef,
    children,
}: {
    rect: DOMRect;
    menuRef: React.RefObject<HTMLDivElement | null>;
    children: React.ReactNode;
}) {
    if (typeof document === "undefined") return null;
    const openUp = window.innerHeight - rect.bottom < 220 && rect.top > 220;
    const style: React.CSSProperties = {
        position: "fixed",
        left: Math.min(rect.left, window.innerWidth - 232),
        ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        zIndex: 9999,
    };
    return createPortal(
        <div ref={menuRef} style={style} onClick={(e) => e.stopPropagation()}>
            {children}
        </div>,
        document.body,
    );
}

function RescheduleMenu({
    todayStr,
    currentDue,
    onSelect,
    align = "right",
    title = "Reschedule",
    inPortal = false,
}: {
    todayStr: string;
    currentDue?: string;
    onSelect: (date: string | null) => void;
    align?: "left" | "right";
    title?: string;
    inPortal?: boolean;
}) {
    const options = [
        { label: "Today", date: todayStr },
        { label: "Tomorrow", date: shiftDate(todayStr, 1) },
        { label: "Next week", date: shiftDate(todayStr, 7) },
    ];
    return (
        <div
            className={`${inPortal ? "" : `absolute z-50 top-full mt-1 ${align === "right" ? "right-0" : "left-0"}`} w-56 bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] rounded-[var(--radius-sm,4px)] shadow-md py-1 text-left`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 pt-1 pb-1.5 text-[10px] uppercase tracking-wider font-semibold text-[var(--app-muted,#888883)]">
                {title}
            </div>
            {options.map((o) => (
                <button
                    key={o.label}
                    type="button"
                    onClick={() => onSelect(o.date)}
                    className="w-full px-3 py-1.5 text-xs flex items-center justify-between gap-2 hover:bg-[var(--app-hover-bg,#F5F5F3)] transition-colors cursor-pointer"
                >
                    <span className={`flex items-center gap-2 ${currentDue === o.date ? "font-semibold text-[var(--app-text,#1A1A1A)]" : "text-[var(--app-text,#1A1A1A)]"}`}>
                        <Calendar className="w-3.5 h-3.5 text-[var(--app-muted,#888883)]" />
                        {o.label}
                    </span>
                    <span className="text-[10px] text-[var(--app-muted,#888883)] tabular-nums">{formatHint(o.date)}</span>
                </button>
            ))}
            <div className="border-t border-[var(--app-border,#E5E5E3)] my-1" />
            <label className="px-3 py-1.5 flex items-center justify-between gap-2 text-xs cursor-pointer">
                <span className="text-[var(--app-muted,#888883)]">Pick a date</span>
                <input
                    type="date"
                    defaultValue={currentDue || ""}
                    onChange={(e) => {
                        if (e.target.value && e.target.value.length === 10) onSelect(e.target.value);
                    }}
                    className="text-[11px] bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[3px] px-1.5 py-0.5 text-[var(--app-text,#1A1A1A)] focus:outline-none focus:border-[var(--app-text,#1A1A1A)]"
                />
            </label>
            {currentDue && (
                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className="w-full px-3 py-1.5 text-xs text-left text-[var(--color-danger,#CB2431)] hover:bg-[var(--color-danger,#CB2431)]/5 transition-colors cursor-pointer"
                >
                    Remove due date
                </button>
            )}
        </div>
    );
}

export default function ListView({
    tasks,
    columns,
    teamMembers,
    currentUser,
    currentTeam,
    onRefresh,
    onSelectTask,
}: ListViewProps) {
    const { setIsAddTaskOpen, activeDateStr } = useWorkspace();

    const [search, setSearch] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedAssignee, setSelectedAssignee] = useState("");
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [bulkAssignee, setBulkAssignee] = useState("");
    const [showArchived] = useState(false);

    const [activePreset, setActivePreset] = useState<FilterPreset>("all");
    const [groupBy, setGroupBy] = useState<GroupByField>("none");
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const [sortField, setSortField] = useState<SortField>("dueDate");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkReassigning, setIsBulkReassigning] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [isReschedulingOverdue, setIsReschedulingOverdue] = useState(false);
    const [isOverdueBannerDismissed, setIsOverdueBannerDismissed] = useState(false);

    // Optimistic UI patches applied on top of server data until the next refresh lands
    const [overrides, setOverrides] = useState<Record<string, Partial<Task>>>({});
    useEffect(() => {
        setOverrides({});
    }, [tasks]);

    // Quick-add state
    const [quickTitle, setQuickTitle] = useState("");
    const [quickPriority, setQuickPriority] = useState("MEDIUM");
    const [quickDue, setQuickDue] = useState("");
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const quickInputRef = useRef<HTMLInputElement>(null);

    // Inline row popover (status / priority / due)
    const [openPopover, setOpenPopover] = useState<{ taskId: string; type: PopoverType; rect: DOMRect } | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const closePopover = React.useCallback(() => setOpenPopover(null), []);
    useClickOutside(popoverRef, Boolean(openPopover), closePopover);

    // Bulk due-date menu
    const [isBulkDueOpen, setIsBulkDueOpen] = useState(false);
    const bulkDueRef = useRef<HTMLDivElement>(null);
    const closeBulkDue = React.useCallback(() => setIsBulkDueOpen(false), []);
    useClickOutside(bulkDueRef, isBulkDueOpen, closeBulkDue);

    const activeMembership = teamMembers.find((tm) => tm.user.id === currentUser.id);
    const userRole = activeMembership ? activeMembership.role : "MEMBER";
    const isObserver = userRole === "OBSERVER";
    const isLeader = userRole === "LEADER";
    const isMember = userRole === "MEMBER";

    const todayStr = getLocalDateString();
    const apiHeaders = { userId: currentUser.id, teamId: currentTeam.id };

    const isColumnComplete = (col?: TaskColumn | null) =>
        Boolean(col && (col.isComplete || /done|complete/i.test(col.name)));

    const completeColumn = useMemo(
        () => columns.find((c) => c.isComplete) || columns.find((c) => /done|complete/i.test(c.name)),
        [columns],
    );
    const defaultOpenColumn = useMemo(
        () => columns.find((c) => !isColumnComplete(c)) || columns[0],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [columns],
    );

    // Server tasks + optimistic overrides
    const tasksView: Task[] = useMemo(
        () =>
            tasks.map((t) => {
                const ov = overrides[t.id];
                if (!ov) return t;
                const merged = { ...t, ...ov } as Task;
                if (ov.columnId) merged.column = columns.find((c) => c.id === ov.columnId) || t.column;
                return merged;
            }),
        [tasks, overrides, columns],
    );

    const getTaskColumn = (t: Task) => columns.find((c) => c.id === t.columnId) || t.column;
    const isTaskCompleted = (t: Task) => isColumnComplete(getTaskColumn(t));
    const getDueStr = (t: Task) => (t.dueDate ? extractDateString(t.dueDate) : "");
    const isTaskOverdue = (t: Task) => {
        const d = getDueStr(t);
        return Boolean(d) && !isTaskCompleted(t) && d < todayStr;
    };
    const isTaskDueToday = (t: Task) => getDueStr(t) === todayStr;

    const canEditTask = (t: Task) =>
        !isObserver && (isLeader || t.createdById === currentUser.id || t.assignedToId === currentUser.id);

    const getDueMeta = (t: Task) => {
        const d = getDueStr(t);
        if (!d) return null;
        const dateObj = parseLocalDate(d);
        const diff = Math.round((dateObj.getTime() - parseLocalDate(todayStr).getTime()) / 86400000);
        const sameYear = d.slice(0, 4) === todayStr.slice(0, 4);
        const short = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(sameYear ? {} : { year: "numeric" }),
        });
        const full = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        let label = short;
        let tone: keyof typeof DUE_TONE_CLS = "normal";
        if (isTaskCompleted(t)) {
            tone = "done";
        } else if (diff < 0) {
            label = `${-diff}d overdue`;
            tone = "overdue";
        } else if (diff === 0) {
            label = "Today";
            tone = "today";
        } else if (diff === 1) {
            label = "Tomorrow";
            tone = "soon";
        } else if (diff < 7) {
            label = dateObj.toLocaleDateString("en-US", { weekday: "long" });
            tone = "soon";
        }
        return { label, tone, full, short, diff };
    };

    const activeTasks = tasksView.filter((t) => {
        if (isMember && t.assignedToId !== currentUser.id) return false;
        return showArchived ? t.isSoftDeleted || t.isArchived : !t.isSoftDeleted && !t.isArchived;
    });

    const filteredTasks = activeTasks.filter((t) => {
        if (activePreset === "overdue" && !isTaskOverdue(t)) return false;
        if (activePreset === "today" && !isTaskDueToday(t)) return false;
        if (activePreset === "urgent" && t.priority !== "URGENT" && t.priority !== "HIGH") return false;
        if (activePreset === "carried" && (!t.carryCount || t.carryCount <= 0)) return false;

        const q = search.toLowerCase();
        const matchesSearch =
            t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
        const matchesPriority = selectedPriority ? t.priority === selectedPriority : true;
        const matchesStatus = selectedStatus ? t.columnId === selectedStatus : true;
        const matchesAssignee = selectedAssignee ? t.assignedToId === selectedAssignee : true;
        return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
    });

    const getPriorityWeight = (p: string) => {
        switch (p) {
            case "URGENT":
                return 4;
            case "HIGH":
                return 3;
            case "MEDIUM":
                return 2;
            default:
                return 1;
        }
    };

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        // Completed tasks always sink to the bottom
        const ca = isTaskCompleted(a);
        const cb = isTaskCompleted(b);
        if (ca !== cb) return ca ? 1 : -1;

        const dir = sortOrder === "asc" ? 1 : -1;
        if (sortField === "dueDate") {
            const da = getDueStr(a);
            const db = getDueStr(b);
            if (!da && !db) return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
            if (!da) return 1; // no due date always last
            if (!db) return -1;
            if (da === db) return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
            return da < db ? -dir : dir;
        }
        if (sortField === "priority") {
            return (getPriorityWeight(a.priority) - getPriorityWeight(b.priority)) * dir;
        }
        if (sortField === "status") {
            return (getTaskColumn(a)?.name || "").localeCompare(getTaskColumn(b)?.name || "") * dir;
        }
        return a.title.localeCompare(b.title) * dir;
    });

    const selectableTasks = isObserver ? [] : sortedTasks.filter((t) => canEditTask(t));
    const validSelectedTasks = selectedTasks.filter((id) => selectableTasks.some((t) => t.id === id));
    const selectedTaskObjects = sortedTasks.filter((t) => validSelectedTasks.includes(t.id));
    const isSelectionMode = validSelectedTasks.length > 0;

    const canBulkDelete =
        validSelectedTasks.length > 0 &&
        (isLeader || selectedTaskObjects.every((t) => t.createdById === currentUser.id));

    const canBulkReassign =
        validSelectedTasks.length > 0 &&
        (isLeader ||
            (bulkAssignee === currentUser.id &&
                selectedTaskObjects.every(
                    (t) => t.createdById === currentUser.id || t.assignedToId === currentUser.id,
                )));

    // ── Optimistic helpers ────────────────────────────────────────────────
    const applyOptimistic = (ids: string[], patch: Partial<Task>) =>
        setOverrides((prev) => {
            const next = { ...prev };
            ids.forEach((id) => {
                next[id] = { ...next[id], ...patch };
            });
            return next;
        });

    const clearOptimistic = (ids: string[]) =>
        setOverrides((prev) => {
            const next = { ...prev };
            ids.forEach((id) => delete next[id]);
            return next;
        });

    const buildReschedulePayload = (t: Task, dateStr: string | null) => {
        if (!dateStr) return { dueDate: null };
        const startStr = extractDateString(t.startDate || t.originalDate || t.date);
        const payload: Record<string, any> = { dueDate: dateStr };
        // Keep the backend's "due >= start" rule satisfied when pulling a task earlier
        if (startStr && startStr > dateStr) payload.startDate = dateStr;
        return payload;
    };

    // ── Handlers ─────────────────────────────────────────────────────────
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleUpdateStatus = async (taskId: string, newColumnId: string) => {
        applyOptimistic([taskId], { columnId: newColumnId });
        try {
            await api.updateTask(taskId, { columnId: newColumnId }, apiHeaders);
            const newCol = columns.find((c) => c.id === newColumnId);
            toast.success(`Moved to ${newCol?.name || "new status"}`);
            if (isColumnComplete(newCol)) triggerMicroCelebration({ intensity: "medium" });
            onRefresh();
        } catch (err: any) {
            clearOptimistic([taskId]);
            toast.error(err.message || "Failed to update status");
        }
    };

    const handleUpdatePriority = async (taskId: string, newPriority: string) => {
        applyOptimistic([taskId], { priority: newPriority });
        try {
            await api.updateTask(taskId, { priority: newPriority }, apiHeaders);
            toast.success("Priority updated");
            onRefresh();
        } catch (err: any) {
            clearOptimistic([taskId]);
            toast.error(err.message || "Failed to update priority");
        }
    };

    const handleToggleComplete = async (task: Task) => {
        if (!canEditTask(task)) return;
        const wasCompleted = isTaskCompleted(task);
        const prevColumnId = task.columnId;
        const targetCol = wasCompleted ? defaultOpenColumn : completeColumn;
        if (!targetCol) {
            toast.error("No 'Done' column is configured for this team.");
            return;
        }

        applyOptimistic([task.id], { columnId: targetCol.id });
        try {
            await api.updateTask(task.id, { columnId: targetCol.id }, apiHeaders);
            if (!wasCompleted) triggerMicroCelebration({ intensity: "medium" });

            const undo = async () => {
                applyOptimistic([task.id], { columnId: prevColumnId });
                try {
                    await api.updateTask(task.id, { columnId: prevColumnId }, apiHeaders);
                    onRefresh();
                } catch (err: any) {
                    clearOptimistic([task.id]);
                    toast.error(err.message || "Failed to undo");
                }
            };

            toast(
                (t) => (
                    <span className="flex items-center gap-3 text-xs">
                        <span>
                            {wasCompleted ? "Reopened" : "Completed"} <strong className="font-semibold">“{task.title.length > 32 ? task.title.slice(0, 32) + "…" : task.title}”</strong>
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                undo();
                            }}
                            className="font-semibold underline underline-offset-2 cursor-pointer"
                        >
                            Undo
                        </button>
                    </span>
                ),
                { duration: 5000 },
            );
            onRefresh();
        } catch (err: any) {
            clearOptimistic([task.id]);
            toast.error(err.message || "Failed to update task");
        }
    };

    const handleReschedule = async (taskIds: string[], dateStr: string | null, successMsg?: string) => {
        const targets = tasksView.filter((t) => taskIds.includes(t.id) && canEditTask(t));
        if (targets.length === 0) return;
        const ids = targets.map((t) => t.id);
        applyOptimistic(ids, { dueDate: dateStr ?? undefined });

        const results = await Promise.allSettled(
            targets.map((t) => api.updateTask(t.id, buildReschedulePayload(t, dateStr), apiHeaders)),
        );
        const failedIds = targets.filter((_, i) => results[i].status === "rejected").map((t) => t.id);
        if (failedIds.length) clearOptimistic(failedIds);

        if (failedIds.length === 0) {
            toast.success(
                successMsg ||
                    (dateStr
                        ? `Due ${parseLocalDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : "Due date removed"),
            );
        } else if (failedIds.length < targets.length) {
            toast.success(`Rescheduled ${targets.length - failedIds.length}. ${failedIds.length} failed.`);
        } else {
            const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
            toast.error(firstErr?.reason?.message || "Failed to reschedule");
        }
        onRefresh();
    };

    const overdueEditableTasks = activeTasks.filter((t) => isTaskOverdue(t) && canEditTask(t));

    const handleRescheduleAllOverdue = async () => {
        if (overdueEditableTasks.length === 0) return;
        setIsReschedulingOverdue(true);
        try {
            const n = overdueEditableTasks.length;
            await handleReschedule(
                overdueEditableTasks.map((t) => t.id),
                todayStr,
                `Moved ${n} overdue task${n === 1 ? "" : "s"} to today`,
            );
        } finally {
            setIsReschedulingOverdue(false);
        }
    };

    const runBulkUpdate = async (
        makePayload: (t: Task) => Record<string, any>,
        patch: Partial<Task> | null,
        label: string,
    ) => {
        const targets = selectedTaskObjects;
        if (targets.length === 0) return;
        const ids = targets.map((t) => t.id);
        setIsBulkUpdating(true);
        if (patch) applyOptimistic(ids, patch);
        try {
            const results = await Promise.allSettled(
                targets.map((t) => api.updateTask(t.id, makePayload(t), apiHeaders)),
            );
            const failedIds = targets.filter((_, i) => results[i].status === "rejected").map((t) => t.id);
            if (failedIds.length) clearOptimistic(failedIds);
            if (failedIds.length === 0) {
                toast.success(`${label} for ${targets.length} task${targets.length === 1 ? "" : "s"}`);
            } else if (failedIds.length < targets.length) {
                toast.success(`${label} for ${targets.length - failedIds.length}. ${failedIds.length} failed.`);
            } else {
                toast.error("Bulk update failed.");
            }
            setSelectedTasks([]);
            onRefresh();
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleBulkStatus = (columnId: string) => {
        if (!columnId) return;
        const col = columns.find((c) => c.id === columnId);
        if (isColumnComplete(col)) triggerMicroCelebration({ intensity: "medium" });
        runBulkUpdate(() => ({ columnId }), { columnId }, `Moved to ${col?.name || "status"}`);
    };

    const handleBulkPriority = (priority: string) => {
        if (!priority) return;
        runBulkUpdate(() => ({ priority }), { priority }, `Priority set to ${PRIORITY_CFG[priority]?.label || priority}`);
    };

    const handleBulkDue = (dateStr: string | null) => {
        setIsBulkDueOpen(false);
        runBulkUpdate(
            (t) => buildReschedulePayload(t, dateStr),
            { dueDate: dateStr ?? undefined },
            dateStr ? "Rescheduled" : "Due date removed",
        );
    };

    const handleBulkComplete = () => {
        if (!completeColumn) {
            toast.error("No 'Done' column is configured for this team.");
            return;
        }
        triggerMicroCelebration({ intensity: "medium" });
        runBulkUpdate(() => ({ columnId: completeColumn.id }), { columnId: completeColumn.id }, "Completed");
    };

    const handleBulkReassign = async () => {
        if (isObserver) {
            toast.error("Observers have read-only access and cannot perform bulk updates.");
            return;
        }
        if (!isLeader && bulkAssignee !== currentUser.id) {
            toast.error("Members can only reassign tasks to themselves.");
            return;
        }
        if (validSelectedTasks.length === 0 || !bulkAssignee) return;
        setIsBulkReassigning(true);
        try {
            await Promise.all(
                validSelectedTasks.map((taskId) => api.updateTask(taskId, { assignedToId: bulkAssignee }, apiHeaders)),
            );
            setSelectedTasks([]);
            setBulkAssignee("");
            onRefresh();
            toast.success("Bulk reassign successful.");
        } catch (err: any) {
            toast.error("Error: " + err.message);
        } finally {
            setIsBulkReassigning(false);
        }
    };

    const handleBulkDelete = () => {
        if (isObserver) {
            toast.error("Observers have read-only access and cannot perform modifications.");
            return;
        }
        if (!canBulkDelete) {
            toast.error("You can only archive/delete tasks that you created.");
            return;
        }
        if (validSelectedTasks.length === 0) return;
        setIsBulkDeleteConfirmOpen(true);
    };

    const handleConfirmBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            const results = await Promise.allSettled(
                validSelectedTasks.map((taskId) => api.deleteTask(taskId, currentUser.id)),
            );
            const failedCount = results.filter((r) => r.status === "rejected").length;

            setSelectedTasks([]);
            setIsBulkDeleteConfirmOpen(false);
            onRefresh();

            if (failedCount === 0) {
                toast.success("Bulk archive completed.");
            } else if (failedCount < validSelectedTasks.length) {
                toast.success(`Archived ${validSelectedTasks.length - failedCount} tasks. ${failedCount} failed.`);
            } else {
                toast.error("Failed to archive selected tasks.");
            }
        } catch (err: any) {
            toast.error("Error during bulk archive: " + err.message);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (isObserver) return;
        setSelectedTasks(checked ? selectableTasks.map((t) => t.id) : []);
    };

    const toggleSelectTask = (taskId: string) => {
        if (isObserver) return;
        setSelectedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
    };

    const handleQuickAdd = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const title = quickTitle.trim();
        if (!title || isQuickAdding) return;
        if (title.length > APP_CONFIG.MAX_TASK_TITLE_LENGTH) {
            toast.error(`Task title must not exceed ${APP_CONFIG.MAX_TASK_TITLE_LENGTH} characters.`);
            return;
        }
        const baseDate = activeDateStr || todayStr;
        const startDate = quickDue && quickDue < baseDate ? quickDue : baseDate;

        setIsQuickAdding(true);
        try {
            await api.createTask({
                title,
                priority: quickPriority,
                columnId: defaultOpenColumn?.id,
                teamId: currentTeam.id,
                createdById: currentUser.id,
                startDate,
                date: baseDate,
                dueDate: quickDue || undefined,
            });
            setQuickTitle("");
            setQuickDue("");
            setQuickPriority("MEDIUM");
            toast.success("Task added");
            onRefresh();
            requestAnimationFrame(() => quickInputRef.current?.focus());
        } catch (err: any) {
            toast.error(err.message || "Failed to create task");
        } finally {
            setIsQuickAdding(false);
        }
    };

    const handleExportCSV = () => {
        if (sortedTasks.length === 0) {
            toast.error("No tasks to export.");
            return;
        }
        const headers = [
            "Title",
            "Status",
            "Priority",
            "Due Date",
            "Assignee",
            "Estimated Hours",
            "Actual Hours",
            "Carried Days",
            "Subtasks Count",
            "Completed Subtasks",
        ];
        const rows = sortedTasks.map((t) => [
            `"${(t.title || "").replace(/"/g, '""')}"`,
            `"${(getTaskColumn(t)?.name || "").replace(/"/g, '""')}"`,
            `"${t.priority || ""}"`,
            `"${getDueStr(t)}"`,
            `"${(t.assignedTo?.fullName || "").replace(/"/g, '""')}"`,
            t.estimatedTime ?? "",
            t.actualTime ?? "",
            t.carryCount ?? 0,
            t.checklist?.length ?? 0,
            t.checklist?.filter((c: any) => c.isCompleted).length ?? 0,
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `tasks_export_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV exported successfully!");
    };

    const toggleGroupCollapse = (groupKey: string) => {
        setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    // ── Grouping ─────────────────────────────────────────────────────────
    interface TaskGroup {
        key: string;
        label: string;
        badgeColor?: string;
        tasks: Task[];
    }

    const groupedTasks: TaskGroup[] = useMemo(() => {
        if (groupBy === "none") return [{ key: "all", label: "All Tasks", tasks: sortedTasks }];

        if (groupBy === "status") {
            return columns
                .map((col) => ({
                    key: `col-${col.id}`,
                    label: col.name,
                    tasks: sortedTasks.filter((t) => t.columnId === col.id),
                }))
                .filter((g) => g.tasks.length > 0);
        }

        if (groupBy === "priority") {
            const levels = [
                { key: "URGENT", label: "Urgent", color: "text-[#CB2431]" },
                { key: "HIGH", label: "High", color: "text-[#B08800]" },
                { key: "MEDIUM", label: "Medium", color: "text-[var(--app-text,#1A1A1A)]" },
                { key: "LOW", label: "Low", color: "text-[var(--app-muted,#888883)]" },
            ];
            return levels
                .map((p) => ({
                    key: `prio-${p.key}`,
                    label: p.label,
                    badgeColor: p.color,
                    tasks: sortedTasks.filter((t) => t.priority === p.key),
                }))
                .filter((g) => g.tasks.length > 0);
        }

        if (groupBy === "dueDate") {
            const overdue = sortedTasks.filter((t) => isTaskOverdue(t));
            const today = sortedTasks.filter((t) => isTaskDueToday(t) && !isTaskOverdue(t));
            const upcoming = sortedTasks.filter((t) => {
                const d = getDueStr(t);
                return Boolean(d) && !isTaskOverdue(t) && !isTaskDueToday(t) && d > todayStr;
            });
            const pastDone = sortedTasks.filter((t) => {
                const d = getDueStr(t);
                return Boolean(d) && d < todayStr && isTaskCompleted(t);
            });
            const noDate = sortedTasks.filter((t) => !getDueStr(t));

            const groups: TaskGroup[] = [];
            if (overdue.length) groups.push({ key: "due-overdue", label: "Overdue", badgeColor: "text-[var(--color-danger,#CB2431)]", tasks: overdue });
            if (today.length) groups.push({ key: "due-today", label: "Due Today", badgeColor: "text-[var(--color-warning,#B08800)]", tasks: today });
            if (upcoming.length) groups.push({ key: "due-upcoming", label: "Upcoming", tasks: upcoming });
            if (pastDone.length) groups.push({ key: "due-past-done", label: "Completed (past due date)", tasks: pastDone });
            if (noDate.length) groups.push({ key: "due-none", label: "No Due Date", tasks: noDate });
            return groups;
        }

        if (groupBy === "assignee") {
            return teamMembers
                .map(({ user }) => ({
                    key: `user-${user.id}`,
                    label: user.id === currentUser.id ? `${user.fullName} (You)` : user.fullName,
                    tasks: sortedTasks.filter((t) => t.assignedToId === user.id),
                }))
                .filter((g) => g.tasks.length > 0);
        }

        return [{ key: "all", label: "All Tasks", tasks: sortedTasks }];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupBy, sortedTasks, columns, teamMembers, currentUser.id, todayStr]);

    const hasMultipleMembers = teamMembers && teamMembers.length > 1;
    const showAssigneeFilter = !isMember && hasMultipleMembers;

    const presetCounts = useMemo(() => {
        return {
            all: activeTasks.length,
            overdue: activeTasks.filter((t) => isTaskOverdue(t)).length,
            today: activeTasks.filter((t) => isTaskDueToday(t)).length,
            urgent: activeTasks.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length,
            carried: activeTasks.filter((t) => Number(t.carryCount) > 0).length,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTasks, todayStr]);

    const hasActiveFilters = Boolean(
        search.trim() || activePreset !== "all" || selectedStatus || selectedPriority || selectedAssignee || groupBy !== "none",
    );

    const handleClearFilters = () => {
        setSearch("");
        setActivePreset("all");
        setSelectedStatus("");
        setSelectedPriority("");
        setSelectedAssignee("");
        setGroupBy("none");
    };

    const sortIndicator = (field: SortField) =>
        sortField === field ? <span className="ml-0.5 text-[9px]">{sortOrder === "asc" ? "▲" : "▼"}</span> : null;

    const COL_COUNT = 8;
    const showOverdueBanner = !isObserver && !isOverdueBannerDismissed && overdueEditableTasks.length > 0;

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--app-bg,#FAFAF9)] text-[var(--app-text,#1A1A1A)] select-none">
                {/* Tier 1: Header — Title + Preset Tabs + Actions */}
                <div className="shrink-0 border-b border-[var(--app-border,#E5E5E3)] bg-[var(--app-card,#FFFFFF)] px-5 py-2.5 flex items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-4 min-w-0 flex-wrap">
                        <div className="flex items-center gap-2 shrink-0">
                            <ListTodo className="w-4 h-4 text-[var(--app-muted,#888883)] shrink-0" />
                            <h1 className="font-heading text-base font-bold tracking-tight text-[var(--app-text,#1A1A1A)] leading-tight whitespace-nowrap">
                                List View
                            </h1>
                        </div>

                        <div className="inline-flex items-center bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] p-0.5 rounded-[var(--radius-sm,4px)] gap-0.5 shrink-0 overflow-x-auto">
                            {[
                                { id: "all", label: "All", count: presetCounts.all },
                                { id: "overdue", label: "Overdue", count: presetCounts.overdue },
                                { id: "today", label: "Today", count: presetCounts.today },
                                { id: "urgent", label: "Urgent", count: presetCounts.urgent },
                                { id: "carried", label: "Carried", count: presetCounts.carried },
                            ].map((preset) => {
                                const isSelected = activePreset === preset.id;
                                const isAlert = preset.id === "overdue" && presetCounts.overdue > 0;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setActivePreset(preset.id as FilterPreset)}
                                        className={`px-2.5 py-1 flex items-center gap-1.5 text-xs font-medium rounded-[var(--radius-xs,2px)] transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-[var(--app-card,#FFFFFF)] text-[var(--app-text,#1A1A1A)] font-semibold shadow-3xs border border-[var(--app-border,#E5E5E3)]"
                                                : "text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] hover:bg-[var(--app-card,#FFFFFF)]/50 border border-transparent"
                                        }`}
                                    >
                                        <span>{preset.label}</span>
                                        {preset.count > 0 && (
                                            <span
                                                className={`px-1.5 rounded-[var(--radius-xs,2px)] text-[10px] tabular-nums font-semibold leading-5 ${
                                                    isSelected
                                                        ? "bg-[var(--app-bg,#FAFAF9)] text-[var(--app-text,#1A1A1A)]"
                                                        : isAlert
                                                        ? "bg-[var(--color-danger,#CB2431)]/10 text-[var(--color-danger,#CB2431)]"
                                                        : "bg-[var(--app-border,#E5E5E3)]/60 text-[var(--app-muted,#888883)]"
                                                }`}
                                            >
                                                {preset.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {!isObserver && (
                            <button
                                type="button"
                                onClick={() => setIsAddTaskOpen(true)}
                                className="bg-[var(--app-text,#1A1A1A)] hover:opacity-85 text-[var(--app-bg,#FAFAF9)] text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm,4px)] flex items-center gap-1.5 transition-opacity cursor-pointer shrink-0"
                                title="Create a task with full details (description, assignee, recurrence…)"
                            >
                                <Plus className="w-3.5 h-3.5 shrink-0" />
                                <span>New Task</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="bg-[var(--app-card,#FFFFFF)] hover:bg-[var(--app-hover-bg,#F5F5F3)] border border-[var(--app-border,#E5E5E3)] text-[var(--app-text,#1A1A1A)] text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm,4px)] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-3xs"
                            title="Export current filtered tasks to CSV"
                        >
                            <Download className="w-3.5 h-3.5 text-[var(--app-muted,#888883)] shrink-0" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Tier 2: Search + Group + Filter Sub-bar */}
                <div className="shrink-0 border-b border-[var(--app-border,#E5E5E3)] bg-[var(--app-bg,#FAFAF9)] px-5 py-2 flex flex-wrap items-center gap-2 select-none">
                    <div className="relative w-52 sm:w-60">
                        <Search className="w-3.5 h-3.5 text-[var(--app-muted,#888883)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tasks..."
                            className="w-full bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] focus:border-[var(--app-text,#1A1A1A)] focus:outline-none text-xs text-[var(--app-text,#1A1A1A)] placeholder-[var(--app-muted,#888883)] pl-8 pr-7 py-1 rounded-[var(--radius-sm,4px)] transition-colors h-[30px]"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] p-0.5 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="w-px h-5 bg-[var(--app-border,#E5E5E3)] mx-0.5 shrink-0" />

                    <CustomSelect
                        options={[
                            { value: "none", label: "Group: Flat List" },
                            { value: "status", label: "Group: By Status" },
                            { value: "priority", label: "Group: By Priority" },
                            { value: "dueDate", label: "Group: By Due Date" },
                            ...(showAssigneeFilter ? [{ value: "assignee", label: "Group: By Assignee" }] : []),
                        ]}
                        value={groupBy}
                        onChange={(val) => setGroupBy(val as GroupByField)}
                        buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)]"
                        className="w-36 h-[30px] shrink-0"
                    />

                    <CustomSelect
                        options={[{ value: "", label: "All Statuses" }, ...columns.map((col) => ({ value: col.id, label: col.name }))]}
                        value={selectedStatus}
                        onChange={(val) => setSelectedStatus(val)}
                        buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)]"
                        className="w-36 h-[30px] shrink-0"
                    />

                    <CustomSelect
                        options={[{ value: "", label: "All Priorities" }, ...PRIORITY_OPTIONS]}
                        value={selectedPriority}
                        onChange={(val) => setSelectedPriority(val)}
                        buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)]"
                        className="w-32 h-[30px] shrink-0"
                    />

                    {showAssigneeFilter && (
                        <CustomSelect
                            options={[
                                { value: "", label: "All Assignees" },
                                ...teamMembers.map(({ user }) => ({
                                    value: user.id,
                                    label: user.fullName,
                                    avatarUrl: user.avatarUrl || null,
                                })),
                            ]}
                            value={selectedAssignee}
                            onChange={(val) => setSelectedAssignee(val)}
                            buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)]"
                            className="w-36 h-[30px] shrink-0"
                        />
                    )}

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="ml-auto flex items-center gap-1 text-xs text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] px-2 py-1 rounded-[var(--radius-sm,4px)] hover:bg-[var(--app-card,#FFFFFF)] border border-transparent hover:border-[var(--app-border,#E5E5E3)] transition-colors cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-28 flex flex-col gap-3">
                    {/* Overdue triage banner */}
                    {showOverdueBanner && (
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-[var(--radius-sm,4px)] border border-[var(--color-danger,#CB2431)]/25 bg-[var(--color-danger,#CB2431)]/5">
                            <div className="flex items-center gap-2 text-xs text-[var(--app-text,#1A1A1A)]">
                                <AlertTriangle className="w-4 h-4 text-[var(--color-danger,#CB2431)] shrink-0" />
                                <span>
                                    <strong className="font-semibold">
                                        {overdueEditableTasks.length} overdue task{overdueEditableTasks.length === 1 ? "" : "s"}
                                    </strong>{" "}
                                    <span className="text-[var(--app-muted,#888883)]">— reschedule them so nothing slips through.</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {activePreset !== "overdue" && (
                                    <button
                                        type="button"
                                        onClick={() => setActivePreset("overdue")}
                                        className="text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm,4px)] border border-[var(--app-border,#E5E5E3)] bg-[var(--app-card,#FFFFFF)] hover:bg-[var(--app-hover-bg,#F5F5F3)] transition-colors cursor-pointer"
                                    >
                                        Review
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRescheduleAllOverdue}
                                    disabled={isReschedulingOverdue}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm,4px)] bg-[var(--app-text,#1A1A1A)] text-[var(--app-bg,#FAFAF9)] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer flex items-center gap-1.5"
                                >
                                    {isReschedulingOverdue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                                    Move all to Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsOverdueBannerDismissed(true)}
                                    className="p-1 text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] cursor-pointer"
                                    title="Dismiss"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Bulk Actions Bar */}
                    {isSelectionMode && !isObserver && (
                        <div className="sticky top-0 z-30 bg-[var(--app-card,#FFFFFF)] border border-[var(--app-text,#1A1A1A)]/20 p-2 px-3 rounded-[var(--radius-sm,4px)] flex flex-wrap items-center gap-2 shadow-md">
                            <span className="text-xs font-semibold text-[var(--app-text,#1A1A1A)] pr-1">
                                {validSelectedTasks.length} selected
                            </span>
                            <div className="w-px h-5 bg-[var(--app-border,#E5E5E3)]" />

                            {completeColumn && (
                                <button
                                    type="button"
                                    onClick={handleBulkComplete}
                                    disabled={isBulkUpdating}
                                    className="h-[30px] px-2.5 text-xs font-semibold rounded-[var(--radius-sm,4px)] bg-[var(--color-success,#16A34A)]/10 text-[var(--color-success,#16A34A)] border border-[var(--color-success,#16A34A)]/25 hover:bg-[var(--color-success,#16A34A)]/20 disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Complete
                                </button>
                            )}

                            <CustomSelect
                                options={[{ value: "", label: "Set status…" }, ...columns.map((c) => ({ value: c.id, label: c.name }))]}
                                value=""
                                onChange={handleBulkStatus}
                                disabled={isBulkUpdating}
                                buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)]"
                                className="w-32 h-[30px]"
                            />

                            <CustomSelect
                                options={[{ value: "", label: "Set priority…" }, ...PRIORITY_OPTIONS]}
                                value=""
                                onChange={handleBulkPriority}
                                disabled={isBulkUpdating}
                                buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)]"
                                className="w-32 h-[30px]"
                            />

                            <div className="relative" ref={bulkDueRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsBulkDueOpen((v) => !v)}
                                    disabled={isBulkUpdating}
                                    className="h-[30px] px-2.5 text-xs font-medium rounded-[var(--radius-sm,4px)] bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] hover:bg-[var(--app-hover-bg,#F5F5F3)] disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Calendar className="w-3.5 h-3.5 text-[var(--app-muted,#888883)]" />
                                    Set due date
                                    <ChevronDown className="w-3 h-3 text-[var(--app-muted,#888883)]" />
                                </button>
                                {isBulkDueOpen && (
                                    <RescheduleMenu todayStr={todayStr} onSelect={handleBulkDue} align="left" title="Set due date" />
                                )}
                            </div>

                            {isLeader && (
                                <>
                                    <div className="w-px h-5 bg-[var(--app-border,#E5E5E3)]" />
                                    <CustomSelect
                                        options={[
                                            { value: "", label: "Reassign to…" },
                                            ...teamMembers.map(({ user }) => ({
                                                value: user.id,
                                                label: user.fullName,
                                                avatarUrl: user.avatarUrl || null,
                                            })),
                                        ]}
                                        value={bulkAssignee}
                                        onChange={(val) => setBulkAssignee(val)}
                                        buttonClassName="text-xs h-[30px] !py-0 px-2.5 bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)]"
                                        className="w-40 h-[30px]"
                                    />
                                    {bulkAssignee && (
                                        <button
                                            type="button"
                                            onClick={handleBulkReassign}
                                            disabled={!canBulkReassign || isBulkReassigning}
                                            className="h-[30px] bg-[var(--app-text,#1A1A1A)] text-[var(--app-bg,#FAFAF9)] hover:opacity-90 disabled:opacity-50 text-xs font-semibold px-3 rounded-[var(--radius-sm,4px)] transition-all cursor-pointer"
                                        >
                                            {isBulkReassigning ? "Reassigning…" : "Reassign"}
                                        </button>
                                    )}
                                </>
                            )}

                            <div className="ml-auto flex items-center gap-1.5">
                                {canBulkDelete && (
                                    <button
                                        type="button"
                                        onClick={handleBulkDelete}
                                        className="h-[30px] px-2.5 text-xs font-semibold rounded-[var(--radius-sm,4px)] text-[var(--color-danger,#CB2431)] hover:bg-[var(--color-danger,#CB2431)]/10 border border-transparent hover:border-[var(--color-danger,#CB2431)]/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Archive selected tasks"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedTasks([])}
                                    className="h-[30px] px-2 text-xs text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)] rounded-[var(--radius-sm,4px)] hover:bg-[var(--app-hover-bg,#F5F5F3)] flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Clear selection"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Task Table Card */}
                    <div className="relative bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] rounded-[var(--radius-sm,4px)] shadow-xs">
                        {/* Inline quick-add */}
                        {!isObserver && (
                            <form
                                onSubmit={handleQuickAdd}
                                className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[var(--app-border,#E5E5E3)]"
                            >
                                <div className="w-9 flex justify-center shrink-0">
                                    {isQuickAdding ? (
                                        <Loader2 className="w-4 h-4 text-[var(--app-muted,#888883)] animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4 text-[var(--app-muted,#888883)]" />
                                    )}
                                </div>
                                <input
                                    ref={quickInputRef}
                                    type="text"
                                    value={quickTitle}
                                    onChange={(e) => setQuickTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                            setQuickTitle("");
                                            setQuickDue("");
                                            (e.target as HTMLInputElement).blur();
                                        }
                                    }}
                                    maxLength={APP_CONFIG.MAX_TASK_TITLE_LENGTH}
                                    placeholder="Add a task… press Enter to save"
                                    disabled={isQuickAdding}
                                    className="flex-1 min-w-[200px] bg-transparent text-[13px] text-[var(--app-text,#1A1A1A)] placeholder-[var(--app-muted,#888883)] focus:outline-none py-1"
                                />
                                {quickTitle.trim() && (
                                    <div className="flex items-center gap-1.5 flex-wrap animate-fade-in">
                                        {/* Due chips */}
                                        <div className="flex items-center bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[var(--radius-sm,4px)] p-0.5 text-[11px]">
                                            {[
                                                { label: "No date", value: "" },
                                                { label: "Today", value: todayStr },
                                                { label: "Tomorrow", value: shiftDate(todayStr, 1) },
                                            ].map((o) => (
                                                <button
                                                    key={o.label}
                                                    type="button"
                                                    onClick={() => setQuickDue(o.value)}
                                                    className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                                                        quickDue === o.value
                                                            ? "bg-[var(--app-card,#FFFFFF)] text-[var(--app-text,#1A1A1A)] font-semibold shadow-3xs"
                                                            : "text-[var(--app-muted,#888883)] hover:text-[var(--app-text,#1A1A1A)]"
                                                    }`}
                                                >
                                                    {o.label}
                                                </button>
                                            ))}
                                            <input
                                                type="date"
                                                value={quickDue && quickDue !== todayStr && quickDue !== shiftDate(todayStr, 1) ? quickDue : ""}
                                                onChange={(e) => setQuickDue(e.target.value)}
                                                className="ml-0.5 text-[11px] bg-transparent text-[var(--app-text,#1A1A1A)] px-1 focus:outline-none cursor-pointer"
                                                title="Pick a due date"
                                            />
                                        </div>
                                        {/* Priority */}
                                        <CustomSelect
                                            options={PRIORITY_OPTIONS}
                                            value={quickPriority}
                                            onChange={setQuickPriority}
                                            buttonClassName="text-[11px] h-[26px] !py-0 px-2 bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)]"
                                            className="w-24 h-[26px]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isQuickAdding}
                                            className="h-[26px] px-2.5 text-[11px] font-semibold rounded-[var(--radius-sm,4px)] bg-[var(--app-text,#1A1A1A)] text-[var(--app-bg,#FAFAF9)] hover:opacity-90 disabled:opacity-50 flex items-center gap-1 transition-opacity cursor-pointer"
                                        >
                                            Add
                                            <CornerDownLeft className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}

                        <div className="overflow-x-auto xl:overflow-visible">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--app-border,#E5E5E3)] text-[11px] font-medium text-[var(--app-muted,#888883)] bg-[var(--app-bg,#FAFAF9)]">
                                        <th className="py-2.5 pl-3 pr-1 w-9 text-center">
                                            {!isObserver && selectableTasks.length > 0 && (
                                                <Checkbox
                                                    checked={selectableTasks.length > 0 && validSelectedTasks.length === selectableTasks.length}
                                                    onChange={(checked) => handleSelectAll(checked)}
                                                />
                                            )}
                                        </th>
                                        <th className="py-2.5 px-1 w-8" aria-label="Complete" />
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] transition-colors" onClick={() => handleSort("title")}>
                                            Title{sortIndicator("title")}
                                        </th>
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] transition-colors w-40" onClick={() => handleSort("status")}>
                                            Status{sortIndicator("status")}
                                        </th>
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] transition-colors w-28" onClick={() => handleSort("priority")}>
                                            Priority{sortIndicator("priority")}
                                        </th>
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] transition-colors w-36" onClick={() => handleSort("dueDate")}>
                                            Due{sortIndicator("dueDate")}
                                        </th>
                                        <th className="py-2.5 px-3 w-40">Assignee</th>
                                        <th className="py-2.5 px-3 w-20 text-center" title="Number of days this task has been carried forward from a previous day">
                                            Carried
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--app-border,#E5E5E3)]">
                                    {sortedTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={COL_COUNT} className="py-14 text-center">
                                                {activeTasks.length === 0 ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <CheckCircle2 className="w-8 h-8 text-[var(--app-border,#E5E5E3)]" />
                                                        <p className="text-sm font-semibold text-[var(--app-text,#1A1A1A)]">Nothing scheduled yet</p>
                                                        <p className="text-xs text-[var(--app-muted,#888883)]">
                                                            {isObserver ? "There are no tasks for this day." : "Type a task in the box above and press Enter."}
                                                        </p>
                                                        {!isObserver && (
                                                            <button
                                                                type="button"
                                                                onClick={() => quickInputRef.current?.focus()}
                                                                className="mt-1 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-sm,4px)] bg-[var(--app-text,#1A1A1A)] text-[var(--app-bg,#FAFAF9)] hover:opacity-90 cursor-pointer"
                                                            >
                                                                Add a task
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search className="w-7 h-7 text-[var(--app-border,#E5E5E3)]" />
                                                        <p className="text-sm font-semibold text-[var(--app-text,#1A1A1A)]">No tasks match your filters</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleClearFilters}
                                                            className="mt-1 text-xs font-medium px-3 py-1.5 rounded-[var(--radius-sm,4px)] border border-[var(--app-border,#E5E5E3)] hover:bg-[var(--app-hover-bg,#F5F5F3)] cursor-pointer"
                                                        >
                                                            Clear filters
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        groupedTasks.map((group) => {
                                            const isCollapsed = groupBy !== "none" && collapsedGroups[group.key];
                                            const groupEstHours = group.tasks.reduce((sum, t) => sum + (Number(t.estimatedTime) || 0), 0);

                                            return (
                                                <React.Fragment key={group.key}>
                                                    {groupBy !== "none" && (
                                                        <tr
                                                            className="bg-[var(--app-bg,#FAFAF9)]/80 hover:bg-[var(--app-hover-bg,#F5F5F3)] transition-colors cursor-pointer border-b border-[var(--app-border,#E5E5E3)] font-semibold text-[11px]"
                                                            onClick={() => toggleGroupCollapse(group.key)}
                                                        >
                                                            <td colSpan={COL_COUNT} className="py-2 px-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        {isCollapsed ? (
                                                                            <ChevronRight className="w-3.5 h-3.5 text-[var(--app-muted,#888883)]" />
                                                                        ) : (
                                                                            <ChevronDown className="w-3.5 h-3.5 text-[var(--app-muted,#888883)]" />
                                                                        )}
                                                                        <span className={group.badgeColor || "text-[var(--app-text,#1A1A1A)]"}>{group.label}</span>
                                                                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-[2px] bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] text-[var(--app-muted,#888883)]">
                                                                            {group.tasks.length}
                                                                        </span>
                                                                    </div>
                                                                    {groupEstHours > 0 && (
                                                                        <span className="text-[10px] font-normal text-[var(--app-muted,#888883)]">{groupEstHours}h est</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}

                                                    {!isCollapsed &&
                                                        group.tasks.map((task) => {
                                                            const isChecked = validSelectedTasks.includes(task.id);
                                                            const completed = isTaskCompleted(task);
                                                            const editable = canEditTask(task);
                                                            const isSelectable = selectableTasks.some((st) => st.id === task.id);
                                                            const column = getTaskColumn(task);
                                                            const dueMeta = getDueMeta(task);
                                                            const dueStr = getDueStr(task);
                                                            const pCfg = PRIORITY_CFG[task.priority] || PRIORITY_CFG.LOW;
                                                            const totalChecklist = task.checklist?.length || 0;
                                                            const completedChecklist = task.checklist?.filter((c: any) => c.isCompleted).length || 0;
                                                            const isPopoverOpen = (type: PopoverType) =>
                                                                openPopover?.taskId === task.id && openPopover.type === type;
                                                            const togglePopover = (type: PopoverType, e: React.MouseEvent<HTMLButtonElement>) => {
                                                                if (isPopoverOpen(type)) {
                                                                    setOpenPopover(null);
                                                                } else {
                                                                    setOpenPopover({
                                                                        taskId: task.id,
                                                                        type,
                                                                        rect: e.currentTarget.getBoundingClientRect(),
                                                                    });
                                                                }
                                                            };
                                                            const cleanDesc = task.description ? task.description.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() : "";
                                                            const originalLabel = task.originalDate
                                                                ? parseLocalDate(extractDateString(task.originalDate)).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                                                : "";

                                                            return (
                                                                <tr
                                                                    key={task.id}
                                                                    className={`group transition-colors cursor-pointer ${
                                                                        isChecked ? "bg-[var(--app-hover-bg,#F5F5F3)]" : "hover:bg-[var(--app-hover-bg,#FAFAF9)]"
                                                                    }`}
                                                                    onClick={() => onSelectTask(task.id)}
                                                                >
                                                                    {/* Selection checkbox (hover-revealed) */}
                                                                    <td className="py-2.5 pl-3 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                                                                        {isSelectable && (
                                                                            <div
                                                                                className={`transition-opacity ${
                                                                                    isSelectionMode || isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                                                                                }`}
                                                                            >
                                                                                <Checkbox checked={isChecked} onChange={() => toggleSelectTask(task.id)} />
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    {/* One-click complete */}
                                                                    <td className="py-2.5 px-1" onClick={(e) => e.stopPropagation()}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleComplete(task)}
                                                                            disabled={!editable}
                                                                            title={!editable ? "Read-only" : completed ? "Mark as not done" : "Mark as done"}
                                                                            className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                                                                                completed
                                                                                    ? "bg-[var(--color-success,#16A34A)] border-[var(--color-success,#16A34A)] text-white"
                                                                                    : editable
                                                                                    ? "border-[var(--app-muted,#888883)]/60 text-transparent hover:border-[var(--color-success,#16A34A)] hover:text-[var(--color-success,#16A34A)] hover:bg-[var(--color-success,#16A34A)]/10 cursor-pointer"
                                                                                    : "border-[var(--app-border,#E5E5E3)] text-transparent cursor-not-allowed"
                                                                            }`}
                                                                        >
                                                                            <Check className="w-3 h-3" strokeWidth={3} />
                                                                        </button>
                                                                    </td>

                                                                    {/* Title */}
                                                                    <td className="py-2.5 px-3">
                                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <span
                                                                                    className={`truncate max-w-[420px] text-[13px] font-medium transition-colors ${
                                                                                        completed
                                                                                            ? "line-through text-[var(--app-muted,#888883)]"
                                                                                            : "text-[var(--app-text,#1A1A1A)] group-hover:text-[var(--color-accent,#1A1A1A)]"
                                                                                    }`}
                                                                                    title={task.title}
                                                                                >
                                                                                    {task.title}
                                                                                </span>
                                                                                {totalChecklist > 0 && (
                                                                                    <span
                                                                                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-[2px] border shrink-0 ${
                                                                                            completedChecklist === totalChecklist
                                                                                                ? "text-[var(--color-success,#16A34A)] bg-[var(--color-success,#16A34A)]/10 border-[var(--color-success,#16A34A)]/20"
                                                                                                : "text-[var(--app-muted,#888883)] bg-[var(--app-bg,#FAFAF9)] border-[var(--app-border,#E5E5E3)]"
                                                                                        }`}
                                                                                        title={`${completedChecklist} of ${totalChecklist} subtasks completed`}
                                                                                    >
                                                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                                                        {completedChecklist}/{totalChecklist}
                                                                                    </span>
                                                                                )}
                                                                                {Boolean(task._count?.comments) && (
                                                                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--app-muted,#888883)] shrink-0" title={`${task._count?.comments} comment(s)`}>
                                                                                        <MessageSquare className="w-3 h-3" />
                                                                                        {task._count?.comments}
                                                                                    </span>
                                                                                )}
                                                                                {Boolean(task._count?.attachments) && (
                                                                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--app-muted,#888883)] shrink-0" title={`${task._count?.attachments} attachment(s)`}>
                                                                                        <Paperclip className="w-3 h-3" />
                                                                                        {task._count?.attachments}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {cleanDesc && (
                                                                                <span className="text-[11px] text-[var(--app-muted,#888883)] truncate max-w-[420px]">{cleanDesc}</span>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Status */}
                                                                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="relative inline-block">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => editable && togglePopover("status", e)}
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] font-medium border whitespace-nowrap transition-colors ${
                                                                                    editable ? "cursor-pointer hover:border-[var(--app-border-strong,#CFCFCB)]" : "cursor-default"
                                                                                } ${
                                                                                    completed
                                                                                        ? "bg-[var(--color-success,#16A34A)]/10 border-[var(--color-success,#16A34A)]/20 text-[var(--color-success,#16A34A)]"
                                                                                        : "bg-[var(--app-bg,#FAFAF9)] border-[var(--app-border,#E5E5E3)] text-[var(--app-text,#1A1A1A)]"
                                                                                }`}
                                                                                title={column?.name}
                                                                            >
                                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${completed ? "bg-[var(--color-success,#16A34A)]" : "bg-[var(--app-muted,#888883)]"}`} />
                                                                                <span className="max-w-[120px] truncate">{column?.name || "—"}</span>
                                                                                {editable && <ChevronDown className="w-3 h-3 text-[var(--app-muted,#888883)] shrink-0" />}
                                                                            </button>
                                                                            {isPopoverOpen("status") && openPopover && (
                                                                                <PortalMenu rect={openPopover.rect} menuRef={popoverRef}>
                                                                                    <div className="bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] rounded-[var(--radius-sm,4px)] shadow-md py-1 min-w-[160px]">
                                                                                        {columns.map((col) => (
                                                                                            <button
                                                                                                key={col.id}
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setOpenPopover(null);
                                                                                                    if (col.id !== task.columnId) handleUpdateStatus(task.id, col.id);
                                                                                                }}
                                                                                                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--app-hover-bg,#F5F5F3)] transition-colors cursor-pointer ${
                                                                                                    task.columnId === col.id ? "font-semibold text-[var(--app-text,#1A1A1A)]" : "text-[var(--app-text,#1A1A1A)]"
                                                                                                }`}
                                                                                            >
                                                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isColumnComplete(col) ? "bg-[var(--color-success,#16A34A)]" : task.columnId === col.id ? "bg-[var(--app-text,#1A1A1A)]" : "bg-[var(--app-border,#E5E5E3)]"}`} />
                                                                                                <span className="flex-1">{col.name}</span>
                                                                                                {task.columnId === col.id && <Check className="w-3 h-3 text-[var(--app-muted,#888883)]" />}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </PortalMenu>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Priority */}
                                                                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="relative inline-block">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => editable && togglePopover("priority", e)}
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] font-medium border whitespace-nowrap transition-colors ${editable ? "cursor-pointer hover:opacity-80" : "cursor-default"} ${pCfg.pill}`}
                                                                            >
                                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pCfg.dot}`} />
                                                                                {pCfg.label}
                                                                                {editable && <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />}
                                                                            </button>
                                                                            {isPopoverOpen("priority") && openPopover && (
                                                                                <PortalMenu rect={openPopover.rect} menuRef={popoverRef}>
                                                                                    <div className="bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] rounded-[var(--radius-sm,4px)] shadow-md py-1 min-w-[120px]">
                                                                                        {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                                                                                            <button
                                                                                                key={p}
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setOpenPopover(null);
                                                                                                    if (p !== task.priority) handleUpdatePriority(task.id, p);
                                                                                                }}
                                                                                                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--app-hover-bg,#F5F5F3)] transition-colors cursor-pointer ${task.priority === p ? "font-semibold" : ""}`}
                                                                                            >
                                                                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_CFG[p].dot}`} />
                                                                                                <span className="flex-1">{PRIORITY_CFG[p].label}</span>
                                                                                                {task.priority === p && <Check className="w-3 h-3 text-[var(--app-muted,#888883)]" />}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </PortalMenu>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Due date + quick reschedule */}
                                                                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                                                        <div className="relative inline-block">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => editable && togglePopover("due", e)}
                                                                                title={dueMeta ? `${dueMeta.full}${editable ? " — click to reschedule" : ""}` : editable ? "Set a due date" : "No due date"}
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[11px] font-medium border whitespace-nowrap tabular-nums transition-colors ${
                                                                                    dueMeta ? DUE_TONE_CLS[dueMeta.tone] : "border-transparent text-[var(--app-muted,#888883)]"
                                                                                } ${editable ? "cursor-pointer hover:border-[var(--app-border,#E5E5E3)] hover:bg-[var(--app-bg,#FAFAF9)]" : "cursor-default"}`}
                                                                            >
                                                                                {dueMeta?.tone === "overdue" ? (
                                                                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                                                                ) : (
                                                                                    <Calendar className="w-3 h-3 shrink-0 opacity-70" />
                                                                                )}
                                                                                {dueMeta ? (
                                                                                    <>
                                                                                        <span>{dueMeta.label}</span>
                                                                                        {dueMeta.tone === "overdue" && (
                                                                                            <span className="font-normal opacity-75">· {dueMeta.short}</span>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <span className={editable ? "opacity-0 group-hover:opacity-100 transition-opacity" : ""}>
                                                                                        {editable ? "Set date" : "—"}
                                                                                    </span>
                                                                                )}
                                                                            </button>
                                                                            {isPopoverOpen("due") && openPopover && (
                                                                                <PortalMenu rect={openPopover.rect} menuRef={popoverRef}>
                                                                                    <RescheduleMenu
                                                                                        todayStr={todayStr}
                                                                                        currentDue={dueStr || undefined}
                                                                                        inPortal
                                                                                        onSelect={(date) => {
                                                                                            setOpenPopover(null);
                                                                                            if (date !== (dueStr || null)) handleReschedule([task.id], date);
                                                                                        }}
                                                                                    />
                                                                                </PortalMenu>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Assignee */}
                                                                    <td className="py-2.5 px-3">
                                                                        {task.assignedTo ? (
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                <UserAvatar name={task.assignedTo.fullName} avatarUrl={task.assignedTo.avatarUrl} size="xs" />
                                                                                <span className="text-xs text-[var(--app-text,#1A1A1A)] truncate max-w-[110px]">
                                                                                    {task.assignedTo.id === currentUser.id ? "You" : task.assignedTo.fullName}
                                                                                </span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-[var(--app-muted,#888883)] italic">Unassigned</span>
                                                                        )}
                                                                    </td>

                                                                    {/* Carried */}
                                                                    <td className="py-2.5 px-3 text-center">
                                                                        {task.carryCount > 0 ? (
                                                                            <span
                                                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-warning,#B08800)] bg-[var(--color-warning,#B08800)]/10 border border-[var(--color-warning,#B08800)]/20 px-1.5 py-0.5 rounded-[2px]"
                                                                                title={`Carried forward ${task.carryCount} day${task.carryCount === 1 ? "" : "s"}${originalLabel ? ` — originally planned for ${originalLabel}` : ""}`}
                                                                            >
                                                                                <RotateCw className="w-2.5 h-2.5" />
                                                                                {task.carryCount}d
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-[var(--app-muted,#888883)]">—</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <ConfirmDialog
                        isOpen={isBulkDeleteConfirmOpen}
                        title="Archive Selected Tasks"
                        description={`Are you sure you want to archive ${validSelectedTasks.length} selected task${validSelectedTasks.length === 1 ? "" : "s"}? They will be moved to the Trash bin.`}
                        confirmText="Archive Selected"
                        cancelText="Cancel"
                        isDanger={true}
                        isLoading={isBulkDeleting}
                        onConfirm={handleConfirmBulkDelete}
                        onClose={() => setIsBulkDeleteConfirmOpen(false)}
                    />
                </div>
            </div>
        </div>
    );
}
