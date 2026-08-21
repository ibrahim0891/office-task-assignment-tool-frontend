import React, { useState } from "react";
import toast from "react-hot-toast";
import { Task, TaskColumn, User, api } from "../api";
import { triggerMicroCelebration } from "../utils/confetti";
import { CustomSelect } from "./ui/CustomSelect";
import { Checkbox } from "./ui/Checkbox";
import ConfirmDialog from "./ui/ConfirmDialog";
import {
    Trash2,
    Download,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    Layers,
    Filter,
} from "lucide-react";
import { Button } from "./ui/Button";

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

export default function ListView({
    tasks,
    columns,
    teamMembers,
    currentUser,
    currentTeam,
    onRefresh,
    onSelectTask,
}: ListViewProps) {
    const [search, setSearch] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedAssignee, setSelectedAssignee] = useState("");
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [bulkAssignee, setBulkAssignee] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    // New Interactive Features
    const [activePreset, setActivePreset] = useState<FilterPreset>("all");
    const [groupBy, setGroupBy] = useState<GroupByField>("none");
    const [collapsedGroups, setCollapsedGroups] = useState<
        Record<string, boolean>
    >({});

    const [sortField, setSortField] = useState<SortField>("dueDate");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] =
        useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkReassigning, setIsBulkReassigning] = useState(false);

    const activeMembership = teamMembers.find(
        (tm) => tm.user.id === currentUser.id,
    );
    const userRole = activeMembership ? activeMembership.role : "MEMBER";
    const isObserver = userRole === "OBSERVER";
    const isLeader = userRole === "LEADER";
    const isMember = userRole === "MEMBER";

    const todayStr = new Date().toISOString().split("T")[0];

    // Check if task is completed
    const isTaskCompleted = (t: Task) => {
        const colName = t.column?.name?.toLowerCase() || "";
        return colName.includes("done") || colName.includes("complete");
    };

    // Check if task is overdue
    const isTaskOverdue = (t: Task) => {
        if (!t.dueDate || isTaskCompleted(t)) return false;
        const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
        return dueStr < todayStr;
    };

    // Check if task is due today
    const isTaskDueToday = (t: Task) => {
        if (!t.dueDate) return false;
        const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
        return dueStr === todayStr;
    };

    const activeTasks = tasks.filter((t) => {
        if (isMember && t.assignedToId !== currentUser.id) {
            return false;
        }
        return showArchived
            ? t.isSoftDeleted || t.isArchived
            : !t.isSoftDeleted && !t.isArchived;
    });

    const filteredTasks = activeTasks.filter((t) => {
        // Preset Filter
        if (activePreset === "overdue" && !isTaskOverdue(t)) return false;
        if (activePreset === "today" && !isTaskDueToday(t)) return false;
        if (
            activePreset === "urgent" &&
            t.priority !== "URGENT" &&
            t.priority !== "HIGH"
        )
            return false;
        if (activePreset === "carried" && (!t.carryCount || t.carryCount <= 0))
            return false;

        // Search Filter
        const matchesSearch =
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            (t.description &&
                t.description.toLowerCase().includes(search.toLowerCase()));

        // Dropdown Filters
        const matchesPriority = selectedPriority
            ? t.priority === selectedPriority
            : true;
        const matchesStatus = selectedStatus
            ? t.columnId === selectedStatus
            : true;
        const matchesAssignee = selectedAssignee
            ? t.assignedToId === selectedAssignee
            : true;

        return (
            matchesSearch && matchesPriority && matchesStatus && matchesAssignee
        );
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
        let valA: any = "";
        let valB: any = "";

        if (sortField === "status") {
            valA = a.column?.name || "";
            valB = b.column?.name || "";
        } else if (sortField === "priority") {
            valA = getPriorityWeight(a.priority);
            valB = getPriorityWeight(b.priority);
        } else if (sortField === "dueDate") {
            valA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            valB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        } else {
            valA = a[sortField as keyof Task];
            valB = b[sortField as keyof Task];
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    // A task is selectable if the user is a LEADER, or if they created it, or if they are assigned to it.
    const selectableTasks = isObserver
        ? []
        : sortedTasks.filter(
              (t) =>
                  isLeader ||
                  t.createdById === currentUser.id ||
                  t.assignedToId === currentUser.id,
          );

    const validSelectedTasks = selectedTasks.filter((id) =>
        selectableTasks.some((t) => t.id === id),
    );

    const selectedTaskObjects = sortedTasks.filter((t) =>
        validSelectedTasks.includes(t.id),
    );

    // Can bulk delete if they created all selected tasks (or are leader)
    const canBulkDelete =
        validSelectedTasks.length > 0 &&
        (isLeader ||
            selectedTaskObjects.every((t) => t.createdById === currentUser.id));

    // Can bulk reassign if they are leader, or if they are reassigning to themselves
    // and they created/are assigned to all selected tasks.
    const canBulkReassign =
        validSelectedTasks.length > 0 &&
        (isLeader ||
            (bulkAssignee === currentUser.id &&
                selectedTaskObjects.every(
                    (t) =>
                        t.createdById === currentUser.id ||
                        t.assignedToId === currentUser.id,
                )));

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const handleBulkReassign = async () => {
        if (isObserver) {
            toast.error(
                "Observers have read-only access and cannot perform bulk updates.",
            );
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
                validSelectedTasks.map((taskId) =>
                    api.updateTask(
                        taskId,
                        { assignedToId: bulkAssignee },
                        { userId: currentUser.id, teamId: currentTeam.id },
                    ),
                ),
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
            toast.error(
                "Observers have read-only access and cannot perform modifications.",
            );
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
                validSelectedTasks.map((taskId) =>
                    api.deleteTask(taskId, currentUser.id),
                ),
            );
            const failedCount = results.filter(
                (r) => r.status === "rejected",
            ).length;

            setSelectedTasks([]);
            setIsBulkDeleteConfirmOpen(false);
            onRefresh();

            if (failedCount === 0) {
                toast.success("Bulk archive completed.");
            } else if (failedCount < validSelectedTasks.length) {
                toast.success(
                    `Archived ${validSelectedTasks.length - failedCount} tasks. ${failedCount} failed.`,
                );
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
        if (checked) {
            setSelectedTasks(selectableTasks.map((t) => t.id));
        } else {
            setSelectedTasks([]);
        }
    };

    const toggleSelectTask = (taskId: string) => {
        if (isObserver) return;
        setSelectedTasks((prev) =>
            prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId],
        );
    };

    const handleUpdateStatus = async (taskId: string, newColumnId: string) => {
        try {
            await api.updateTask(
                taskId,
                { columnId: newColumnId },
                { userId: currentUser.id, teamId: currentTeam.id },
            );
            toast.success("Status updated!");

            const newCol = columns.find((c) => c.id === newColumnId);
            if (
                newCol?.isComplete ||
                newCol?.name.toLowerCase().includes("done") ||
                newCol?.name.toLowerCase().includes("complete")
            ) {
                triggerMicroCelebration({ intensity: "medium" });
            }

            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    };

    const handleUpdatePriority = async (
        taskId: string,
        newPriority: string,
    ) => {
        try {
            await api.updateTask(
                taskId,
                { priority: newPriority },
                { userId: currentUser.id, teamId: currentTeam.id },
            );
            toast.success("Priority updated!");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update priority");
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
            `"${(t.column?.name || "").replace(/"/g, '""')}"`,
            `"${t.priority || ""}"`,
            `"${t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : ""}"`,
            `"${(t.assignedTo?.name || "").replace(/"/g, '""')}"`,
            t.estimatedTime ?? "",
            t.actualTime ?? "",
            t.carryCount ?? 0,
            t.checklist?.length ?? 0,
            t.checklist?.filter((c: any) => c.isCompleted).length ?? 0,
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `tasks_export_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV exported successfully!");
    };

    const toggleGroupCollapse = (groupKey: string) => {
        setCollapsedGroups((prev) => ({
            ...prev,
            [groupKey]: !prev[groupKey],
        }));
    };

    const getPriorityDot = (p: string) => {
        switch (p) {
            case "URGENT":
                return "text-[var(--color-danger,#CB2431)]";
            case "HIGH":
                return "text-[var(--color-warning,#B08800)]";
            case "MEDIUM":
                return "text-[var(--app-text,#1A1A1A)]";
            default:
                return "text-[var(--app-muted,#888883)]";
        }
    };

    // Calculate Totals for Footer
    const totalEstHours = sortedTasks.reduce(
        (sum, t) => sum + (Number(t.estimatedTime) || 0),
        0,
    );
    const totalActHours = sortedTasks.reduce(
        (sum, t) => sum + (Number(t.actualTime) || 0),
        0,
    );
    const totalCarriedDays = sortedTasks.reduce(
        (sum, t) => sum + (Number(t.carryCount) || 0),
        0,
    );

    // Grouping computation
    interface TaskGroup {
        key: string;
        label: string;
        badgeColor?: string;
        tasks: Task[];
    }

    const groupedTasks: TaskGroup[] = React.useMemo(() => {
        if (groupBy === "none") {
            return [{ key: "all", label: "All Tasks", tasks: sortedTasks }];
        }

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
            const priorityLevels = [
                { key: "URGENT", label: "Urgent", color: "text-[#CB2431]" },
                { key: "HIGH", label: "High", color: "text-[#B08800]" },
                { key: "MEDIUM", label: "Medium", color: "text-[#1A1A1A]" },
                { key: "LOW", label: "Low", color: "text-[#888883]" },
            ];
            return priorityLevels
                .map((p) => ({
                    key: `prio-${p.key}`,
                    label: p.label,
                    badgeColor: p.color,
                    tasks: sortedTasks.filter((t) => t.priority === p.key),
                }))
                .filter((g) => g.tasks.length > 0);
        }

        if (groupBy === "dueDate") {
            const overdueTasks = sortedTasks.filter((t) => isTaskOverdue(t));
            const todayTasks = sortedTasks.filter(
                (t) => isTaskDueToday(t) && !isTaskOverdue(t),
            );
            const upcomingTasks = sortedTasks.filter((t) => {
                if (!t.dueDate || isTaskOverdue(t) || isTaskDueToday(t))
                    return false;
                const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
                return dueStr > todayStr;
            });
            const noDateTasks = sortedTasks.filter((t) => !t.dueDate);

            const groups: TaskGroup[] = [];
            if (overdueTasks.length > 0) {
                groups.push({
                    key: "due-overdue",
                    label: "Overdue",
                    badgeColor: "text-[var(--color-danger,#CB2431)]",
                    tasks: overdueTasks,
                });
            }
            if (todayTasks.length > 0) {
                groups.push({
                    key: "due-today",
                    label: "Due Today",
                    badgeColor: "text-[var(--color-warning,#B08800)]",
                    tasks: todayTasks,
                });
            }
            if (upcomingTasks.length > 0) {
                groups.push({
                    key: "due-upcoming",
                    label: "Upcoming",
                    tasks: upcomingTasks,
                });
            }
            if (noDateTasks.length > 0) {
                groups.push({
                    key: "due-none",
                    label: "No Due Date",
                    tasks: noDateTasks,
                });
            }
            return groups;
        }

        if (groupBy === "assignee") {
            return teamMembers
                .map(({ user }) => ({
                    key: `user-${user.id}`,
                    label:
                        user.id === currentUser.id
                            ? `${user.name} (You)`
                            : user.name,
                    tasks: sortedTasks.filter((t) => t.assignedToId === user.id),
                }))
                .filter((g) => g.tasks.length > 0);
        }

        return [{ key: "all", label: "All Tasks", tasks: sortedTasks }];
    }, [
        groupBy,
        sortedTasks,
        columns,
        teamMembers,
        currentUser.id,
        todayStr,
    ]);

    const hasMultipleMembers = teamMembers && teamMembers.length > 1;
    const showAssigneeFilter = !isMember && hasMultipleMembers;

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--app-bg,#FAFAF9)] text-[var(--app-text,#1A1A1A)] flex flex-col gap-3.5 select-none">
            {/* Header with Title and CSV Export */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="font-heading text-xl text-[var(--app-text,#1A1A1A)]">
                        List View
                    </h1>
                    <p className="text-xs text-[var(--app-muted,#888883)] mt-0.5">
                        Search, group, filter, and track tasks.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={handleExportCSV}
                        icon={
                            <Download className="w-3.5 h-3.5 text-[var(--app-text,#1A1A1A)]" />
                        }
                        title="Export current filtered tasks to CSV"
                    >
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Quick Filter Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px]   font-bold text-[var(--app-muted,#888883)] flex items-center gap-1 mr-1 shrink-0">
                    <Filter className="w-3 h-3" />
                    Presets:
                </span>
                {[
                    { id: "all", label: "All Tasks" },
                    { id: "overdue", label: "Overdue" },
                    { id: "today", label: "Due Today" },
                    { id: "urgent", label: "High & Urgent" },
                    { id: "carried", label: "Carried Over" },
                ].map((preset) => {
                    const isActive = activePreset === preset.id;
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() =>
                                setActivePreset(preset.id as FilterPreset)
                            }
                            className={`px-2.5 py-1 text-[11px] rounded-[3px] transition-all font-medium cursor-pointer shrink-0 border ${
                                isActive
                                    ? "bg-[var(--color-accent,#1A1A1A)] text-[var(--app-bg,#FAFAF9)] border-[var(--color-accent,#1A1A1A)] shadow-xs"
                                    : "bg-[var(--app-card,#FFFFFF)] text-[var(--app-text,#1A1A1A)] border-[var(--app-border,#E5E5E3)] hover:border-[var(--color-accent,#1A1A1A)]"
                            }`}
                        >
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            {/* Filters Toolbar */}
            <div className="relative bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] p-3.5 flex flex-col gap-3 corner-brackets rounded-[2px]">
                <div
                    className={`grid grid-cols-1 ${
                        showAssigneeFilter ? "md:grid-cols-5" : "md:grid-cols-4"
                    } gap-2 items-center`}
                >
                    <input
                        type="text"
                        placeholder="Search by title, details…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-[var(--app-bg,#FAFAF9)] border border-[var(--app-border,#E5E5E3)] rounded-[3px] px-2.5 py-1.5 h-[30px] text-[11px] text-[var(--app-text,#1A1A1A)] focus:outline-none focus:border-[var(--color-accent,#1A1A1A)] transition-colors w-full"
                    />

                    {/* Group By Selector */}
                    <CustomSelect
                        options={[
                            { value: "none", label: "Group: Flat List" },
                            { value: "status", label: "Group: By Status" },
                            { value: "priority", label: "Group: By Priority" },
                            { value: "dueDate", label: "Group: By Due Date" },
                            ...(showAssigneeFilter
                                ? [{ value: "assignee", label: "Group: By Assignee" }]
                                : []),
                        ]}
                        value={groupBy}
                        onChange={(val) => setGroupBy(val as GroupByField)}
                        className="w-full"
                    />

                    <CustomSelect
                        options={[
                            { value: "", label: "All Statuses" },
                            ...columns.map((col) => ({
                                value: col.id,
                                label: col.name,
                            })),
                        ]}
                        value={selectedStatus}
                        onChange={(val) => setSelectedStatus(val)}
                        className="w-full"
                    />

                    <CustomSelect
                        options={[
                            { value: "", label: "All Priorities" },
                            { value: "URGENT", label: "Urgent" },
                            { value: "HIGH", label: "High" },
                            { value: "MEDIUM", label: "Medium" },
                            { value: "LOW", label: "Low" },
                        ]}
                        value={selectedPriority}
                        onChange={(val) => setSelectedPriority(val)}
                        className="w-full"
                    />

                    {showAssigneeFilter && (
                        <CustomSelect
                            options={[
                                { value: "", label: "All Assignees" },
                                ...teamMembers.map(({ user }) => ({
                                    value: user.id,
                                    label: user.name,
                                    avatarUrl: user.avatarUrl || null,
                                })),
                            ]}
                            value={selectedAssignee}
                            onChange={(val) => setSelectedAssignee(val)}
                            className="w-full"
                        />
                    )}
                </div>

                {/* Bulk Actions Bar */}
                {validSelectedTasks.length > 0 && !isObserver && (
                    <div className="pt-3 border-t border-[var(--app-border,#E5E5E3)] flex flex-wrap gap-2 items-center justify-between">
                        <span className="text-[11px] font-semibold text-[var(--app-text,#1A1A1A)]">
                            {validSelectedTasks.length} selected
                        </span>
                        <div className="flex items-center gap-2">
                            {isLeader && (
                                <>
                                    <CustomSelect
                                        options={[
                                            { value: "", label: "Reassign to…" },
                                            ...teamMembers.map(({ user }) => ({
                                                value: user.id,
                                                label: user.name,
                                                avatarUrl: user.avatarUrl || null,
                                            })),
                                        ]}
                                        value={bulkAssignee}
                                        onChange={(val) => setBulkAssignee(val)}
                                        className="w-44"
                                    />
                                    <Button
                                        onClick={handleBulkReassign}
                                        disabled={
                                            !bulkAssignee ||
                                            !canBulkReassign ||
                                            isBulkReassigning
                                        }
                                        isLoading={isBulkReassigning}
                                        loadingText="Reassigning…"
                                        showDot={!isBulkReassigning}
                                    >
                                        Reassign
                                    </Button>
                                </>
                            )}
                            {canBulkDelete && (
                                <Button
                                    variant="danger"
                                    onClick={handleBulkDelete}
                                    icon={
                                        <Trash2 className="w-3 h-3 text-[var(--color-danger,#CB2431)]" />
                                    }
                                    title="Archive selected tasks"
                                >
                                    Delete
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedTasks([])}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="relative bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] overflow-hidden corner-brackets rounded-[2px] shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--app-border,#E5E5E3)] text-[11px] font-medium text-[var(--app-muted,#888883)] bg-[var(--app-bg,#FAFAF9)]">
                                <th className="py-2.5 px-3 w-10 text-center">
                                    {!isObserver && (
                                        <Checkbox
                                            checked={
                                                selectableTasks.length > 0 &&
                                                validSelectedTasks.length ===
                                                    selectableTasks.length
                                            }
                                            onChange={(checked) =>
                                                handleSelectAll(checked)
                                            }
                                        />
                                    )}
                                </th>
                                <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] transition-colors"
                                    onClick={() => handleSort("title")}
                                >
                                    Title{" "}
                                    {sortField === "title" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] text-center transition-colors w-32"
                                    onClick={() => handleSort("status")}
                                >
                                    Status{" "}
                                    {sortField === "status" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] text-center transition-colors w-28"
                                    onClick={() => handleSort("priority")}
                                >
                                    Priority{" "}
                                    {sortField === "priority" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-[var(--app-text,#1A1A1A)] text-right transition-colors"
                                    onClick={() => handleSort("dueDate")}
                                >
                                    Due Date{" "}
                                    {sortField === "dueDate" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th className="py-2.5 px-3">Assignee</th>
                                <th className="py-2.5 px-3 text-center">Carry</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-[var(--app-border,#E5E5E3)]">
                            {sortedTasks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-[var(--app-muted,#888883)]"
                                    >
                                        <p className="text-xs">
                                            No matching tasks found.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                groupedTasks.map((group) => {
                                    const isCollapsed =
                                        groupBy !== "none" &&
                                        collapsedGroups[group.key];
                                    const groupEstHours = group.tasks.reduce(
                                        (sum, t) =>
                                            sum + (Number(t.estimatedTime) || 0),
                                        0,
                                    );

                                    return (
                                        <React.Fragment key={group.key}>
                                            {/* Group Header Row */}
                                            {groupBy !== "none" && (
                                                <tr
                                                    className="bg-[var(--app-bg,#FAFAF9)]/80 hover:bg-[var(--app-hover-bg,#F5F5F3)] transition-colors cursor-pointer border-b border-[var(--app-border,#E5E5E3)] font-semibold text-[11px]"
                                                    onClick={() =>
                                                        toggleGroupCollapse(
                                                            group.key,
                                                        )
                                                    }
                                                >
                                                    <td
                                                        colSpan={7}
                                                        className="py-2 px-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {isCollapsed ? (
                                                                    <ChevronRight className="w-3.5 h-3.5 text-[var(--app-muted,#888883)]" />
                                                                ) : (
                                                                    <ChevronDown className="w-3.5 h-3.5 text-[var(--app-muted,#888883)]" />
                                                                )}
                                                                <span
                                                                    className={`flex items-center gap-1.5 ${
                                                                        group.badgeColor ||
                                                                        "text-[var(--app-text,#1A1A1A)]"
                                                                    }`}
                                                                >
                                                                    {group.label}
                                                                </span>
                                                                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-[2px] bg-[var(--app-card,#FFFFFF)] border border-[var(--app-border,#E5E5E3)] text-[var(--app-muted,#888883)]">
                                                                    {group.tasks.length}
                                                                </span>
                                                            </div>
                                                            {groupEstHours > 0 && (
                                                                <span className="text-[10px] font-normal text-[var(--app-muted,#888883)]">
                                                                    {groupEstHours}h
                                                                    est
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Task Rows */}
                                            {!isCollapsed &&
                                                group.tasks.map((task) => {
                                                    const isChecked =
                                                        selectedTasks.includes(
                                                            task.id,
                                                        );
                                                    const overdue =
                                                        isTaskOverdue(task);
                                                    const dueToday =
                                                        isTaskDueToday(task);
                                                    const completed =
                                                        isTaskCompleted(task);

                                                    const totalChecklist =
                                                        task.checklist?.length ||
                                                        0;
                                                    const completedChecklist =
                                                        task.checklist?.filter(
                                                            (c: any) =>
                                                                c.isCompleted,
                                                        ).length || 0;

                                                    const canEditTask =
                                                        !isObserver &&
                                                        (isLeader ||
                                                            task.createdById ===
                                                                currentUser.id ||
                                                            task.assignedToId ===
                                                                currentUser.id);

                                                    return (
                                                        <tr
                                                            key={task.id}
                                                            className={`hover:bg-[var(--app-hover-bg,#FAFAF9)] transition-colors cursor-pointer ${
                                                                isChecked
                                                                    ? "bg-[var(--app-hover-bg,#F5F5F3)]"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                onSelectTask(
                                                                    task.id,
                                                                )
                                                            }
                                                        >
                                                            {/* Checkbox / Lock */}
                                                            <td
                                                                className="py-2.5 px-3 text-center"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                {!isObserver &&
                                                                    (selectableTasks.some(
                                                                        (st) =>
                                                                            st.id ===
                                                                            task.id,
                                                                    ) ? (
                                                                        <Checkbox
                                                                            checked={
                                                                                isChecked
                                                                            }
                                                                            onChange={() =>
                                                                                toggleSelectTask(
                                                                                    task.id,
                                                                                )
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="w-4 h-4 mx-auto flex items-center justify-center text-[10px]"
                                                                            title="Read-only access"
                                                                        >
                                                                            🔒
                                                                        </div>
                                                                    ))}
                                                            </td>

                                                            {/* Title & Checklist Badge */}
                                                            <td className="py-2.5 px-3 font-medium text-[var(--app-text,#1A1A1A)]">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="truncate max-w-sm text-[12px]">
                                                                            {task.title}
                                                                        </span>

                                                                        {/* Checklist Progress Badge */}
                                                                        {totalChecklist >
                                                                            0 && (
                                                                            <span
                                                                                className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border ${
                                                                                    completedChecklist ===
                                                                                    totalChecklist
                                                                                        ? "text-[var(--color-accent,#00D26A)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20"
                                                                                        : "text-[var(--app-muted,#888883)] bg-[var(--app-bg,#FAFAF9)] border-[var(--app-border,#E5E5E3)]"
                                                                                }`}
                                                                                title={`${completedChecklist} of ${totalChecklist} subtasks completed`}
                                                                            >
                                                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                                                <span>
                                                                                    {completedChecklist}/
                                                                                    {totalChecklist}
                                                                                </span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {task.description && (
                                                                        <span className="text-[10px] text-[var(--app-muted,#888883)] truncate max-w-xs">
                                                                            {task.description
                                                                                .replace(
                                                                                    /<[^>]*>/g,
                                                                                    "",
                                                                                )
                                                                                .trim()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Status (Inline Select) */}
                                                            <td
                                                                className="py-2.5 px-3 text-center"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                {canEditTask ? (
                                                                    <CustomSelect
                                                                        options={columns.map(
                                                                            (
                                                                                c,
                                                                            ) => ({
                                                                                value: c.id,
                                                                                label: c.name,
                                                                            }),
                                                                        )}
                                                                        value={
                                                                            task.columnId
                                                                        }
                                                                        onChange={(
                                                                            val,
                                                                        ) =>
                                                                            handleUpdateStatus(
                                                                                task.id,
                                                                                val,
                                                                            )
                                                                        }
                                                                        className="w-28 mx-auto"
                                                                    />
                                                                ) : (
                                                                    <span className="border border-[var(--app-border,#E5E5E3)] px-2 py-0.5 rounded-[2px] text-[10px] font-medium text-[var(--app-text,#1A1A1A)]">
                                                                        {task
                                                                            .column
                                                                            ?.name ||
                                                                            "—"}
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Priority (Inline Select) */}
                                                            <td
                                                                className="py-2.5 px-3 text-center"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                {canEditTask ? (
                                                                    <CustomSelect
                                                                        options={[
                                                                            {
                                                                                value: "URGENT",
                                                                                label: "Urgent",
                                                                            },
                                                                            {
                                                                                value: "HIGH",
                                                                                label: "High",
                                                                            },
                                                                            {
                                                                                value: "MEDIUM",
                                                                                label: "Medium",
                                                                            },
                                                                            {
                                                                                value: "LOW",
                                                                                label: "Low",
                                                                            },
                                                                        ]}
                                                                        value={
                                                                            task.priority
                                                                        }
                                                                        onChange={(
                                                                            val,
                                                                        ) =>
                                                                            handleUpdatePriority(
                                                                                task.id,
                                                                                val,
                                                                            )
                                                                        }
                                                                        className="w-24 mx-auto"
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className={`text-[10px] font-medium ${getPriorityDot(
                                                                            task.priority,
                                                                        )}`}
                                                                    >
                                                                        ●{" "}
                                                                        {
                                                                            task.priority
                                                                        }
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Due Date & Urgency Indicator */}
                                                            <td className="py-2.5 px-3 text-right text-[11px] font-medium tabular-nums">
                                                                {task.dueDate ? (
                                                                    overdue ? (
                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium text-[var(--color-danger,#CB2431)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/25">
                                                                            <AlertCircle className="w-2.5 h-2.5" />
                                                                            {new Date(
                                                                                task.dueDate,
                                                                            ).toLocaleDateString()}
                                                                        </span>
                                                                    ) : dueToday ? (
                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium text-[var(--color-warning,#B08800)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/25">
                                                                            <Clock className="w-2.5 h-2.5" />
                                                                            Today
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[var(--app-text,#1A1A1A)]">
                                                                            {new Date(
                                                                                task.dueDate,
                                                                            ).toLocaleDateString()}
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <span className="text-[var(--app-muted,#888883)]">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </td>

                                                            {/* Assignee */}
                                                            <td className="py-2.5 px-3 text-[11px] text-[var(--app-text,#1A1A1A)]">
                                                                {task.assignedTo
                                                                    ?.name ||
                                                                    "Unassigned"}
                                                            </td>

                                                            {/* Carry Days */}
                                                            <td className="py-2.5 px-3 text-center text-[11px] tabular-nums">
                                                                {task.carryCount >
                                                                0 ? (
                                                                    <span className="text-[9px] font-medium text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-1.5 py-0.5 rounded-[2px] shrink-0">
                                                                        {task.carryCount}d
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[var(--app-muted,#888883)]">
                                                                        —
                                                                    </span>
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

                        {/* Summary & Totals Footer */}
                        {sortedTasks.length > 0 && (
                            <tfoot>
                                <tr className="border-t-2 border-[var(--app-border,#E5E5E3)] bg-[var(--app-bg,#FAFAF9)] text-[11px] font-semibold text-[var(--app-text,#1A1A1A)]">
                                    <td
                                        colSpan={2}
                                        className="py-2.5 px-3 text-left"
                                    >
                                        <span className="text-[var(--app-muted,#888883)] font-normal">
                                            Summary:{" "}
                                        </span>
                                        {sortedTasks.length} task
                                        {sortedTasks.length === 1 ? "" : "s"}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-[10px] text-[var(--app-muted,#888883)]">
                                        {totalEstHours > 0 || totalActHours > 0
                                            ? `${totalEstHours}h est / ${totalActHours}h act`
                                            : "—"}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-[10px] text-[var(--app-muted,#888883)]">
                                        —
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-[10px] text-[var(--app-muted,#888883)]">
                                        —
                                    </td>
                                    <td className="py-2.5 px-3 text-left text-[10px] text-[var(--app-muted,#888883)]">
                                        —
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-[10px] text-[var(--color-warning)] font-medium tabular-nums">
                                        {totalCarriedDays > 0
                                            ? `${totalCarriedDays}d carried`
                                            : "—"}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isBulkDeleteConfirmOpen}
                title="Archive Selected Tasks"
                description={`Are you sure you want to archive ${selectedTasks.length} selected tasks? They will be moved to the Trash bin.`}
                confirmText="Archive Selected"
                cancelText="Cancel"
                isDanger={true}
                isLoading={isBulkDeleting}
                onConfirm={handleConfirmBulkDelete}
                onClose={() => setIsBulkDeleteConfirmOpen(false)}
            />
        </div>
    );
}
