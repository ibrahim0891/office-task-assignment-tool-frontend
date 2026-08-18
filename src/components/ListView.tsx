import React, { useState } from "react";
import toast from "react-hot-toast";
import { Task, TaskColumn, User, api } from "../api";
import { CustomSelect } from "./ui/CustomSelect";
import { Checkbox } from "./ui/Checkbox";
import ConfirmDialog from "./ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
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

    const [sortField, setSortField] = useState<SortField>("dueDate");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] =
        useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const activeMembership = teamMembers.find(
        (tm) => tm.user.id === currentUser.id,
    );
    const userRole = activeMembership ? activeMembership.role : "MEMBER";
    const isObserver = userRole === "OBSERVER";

    const activeTasks = tasks.filter((t) =>
        showArchived
            ? t.isSoftDeleted || t.isArchived
            : !t.isSoftDeleted && !t.isArchived,
    );

    const filteredTasks = activeTasks.filter((t) => {
        const matchesSearch =
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            (t.description &&
                t.description.toLowerCase().includes(search.toLowerCase()));
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
            valA = a.column.name;
            valB = b.column.name;
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

    const isLeader = userRole === "LEADER";

    // A task is selectable if the user is a LEADER, or if they created it, or if they are assigned to it.
    const selectableTasks = isObserver
        ? []
        : sortedTasks.filter(
              (t) =>
                  isLeader ||
                  t.createdById === currentUser.id ||
                  t.assignedToId === currentUser.id
          );

    const validSelectedTasks = selectedTasks.filter((id) =>
        selectableTasks.some((t) => t.id === id)
    );

    const selectedTaskObjects = sortedTasks.filter((t) =>
        validSelectedTasks.includes(t.id)
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
                        t.assignedToId === currentUser.id
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
            alert(
                "Observers have read-only access and cannot perform bulk updates.",
            );
            return;
        }
        if (!isLeader && bulkAssignee !== currentUser.id) {
            alert("Members can only reassign tasks to themselves.");
            return;
        }
        if (validSelectedTasks.length === 0 || !bulkAssignee) return;
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
            alert("Bulk reassign successful.");
        } catch (err: any) {
            alert("Error: " + err.message);
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
                validSelectedTasks.map((taskId) => api.deleteTask(taskId, currentUser.id))
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
                { userId: currentUser.id, teamId: currentTeam.id }
            );
            toast.success("Status updated!");
            onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    };

    const getPriorityDot = (p: string) => {
        switch (p) {
            case "URGENT":
                return "text-[#CB2431]";
            case "HIGH":
                return "text-[#B08800]";
            case "MEDIUM":
                return "text-[#1A1A1A]";
            default:
                return "text-[#888883]";
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-[#FAFAF9] text-[#1A1A1A] flex flex-col gap-3.5 select-none">
            {/* Header */}
            <div>
                <h1 className="font-heading text-xl">List View</h1>
                <p className="text-base text-[#888883] mt-0.5">
                    Search, sort, filter, and bulk-update tasks.
                </p>
            </div>

            {/* Filters */}
            <div className="relative border border-[#E5E5E3] p-3.5 flex flex-col gap-3 corner-brackets rounded-[2px]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                    <input
                        type="text"
                        placeholder="Search by title, details…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white border border-[#E5E5E3] rounded-[3px] px-2.5 py-1.5 h-[30px] text-[11px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors w-full"
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
                </div>

                {/* Bulk Actions */}
                {validSelectedTasks.length > 0 && !isObserver && (
                    <div className="pt-3 border-t border-[#E5E5E3] flex flex-wrap gap-2 items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#1A1A1A]">
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
                                        disabled={!bulkAssignee || !canBulkReassign}
                                        showDot
                                    >
                                        Reassign
                                    </Button>
                                </>
                            )}
                            {canBulkDelete && (
                                <Button
                                    variant="danger"
                                    onClick={handleBulkDelete}
                                    icon={<Trash2 className="w-3 h-3 text-[#CB2431]" />}
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
            <div className="relative border border-[#E5E5E3] overflow-hidden corner-brackets rounded-[2px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-[#E5E5E3] text-[11px] font-medium text-[#888883] bg-[#FAFAF9]">
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
                                    className="py-2.5 px-3 cursor-pointer hover:text-[#1A1A1A] transition-colors"
                                    onClick={() => handleSort("title")}
                                >
                                    Title{" "}
                                    {sortField === "title" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-[#1A1A1A] text-center transition-colors"
                                    onClick={() => handleSort("status")}
                                >
                                    Status{" "}
                                    {sortField === "status" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-[#1A1A1A] text-center transition-colors"
                                    onClick={() => handleSort("priority")}
                                >
                                    Priority{" "}
                                    {sortField === "priority" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th
                                    className="py-2.5 px-3 cursor-pointer hover:text-[#1A1A1A] text-right transition-colors"
                                    onClick={() => handleSort("dueDate")}
                                >
                                    Due{" "}
                                    {sortField === "dueDate" &&
                                        (sortOrder === "asc" ? "▲" : "▼")}
                                </th>
                                <th className="py-2.5 px-3">Assignee</th>
                                <th className="py-2.5 px-3 text-center">
                                    Carry
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E3]">
                            {sortedTasks.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-8 text-center text-[#888883]"
                                    >
                                        <p className="text-[11px]">
                                            No matching tasks found.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                sortedTasks.map((task) => {
                                    const isChecked = selectedTasks.includes(
                                        task.id,
                                    );
                                    return (
                                        <tr
                                            key={task.id}
                                            className={`hover:bg-[#FAFAF9] transition-colors cursor-pointer ${isChecked ? "bg-[#F5F5F3]" : ""
                                                }`}
                                            onClick={() =>
                                                onSelectTask(task.id)
                                            }
                                        >
                                            <td
                                                className="py-2.5 px-3 text-center"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {!isObserver && (
                                                    selectableTasks.some((st) => st.id === task.id) ? (
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onChange={() =>
                                                                toggleSelectTask(
                                                                    task.id,
                                                                )
                                                            }
                                                        />
                                                    ) : (
                                                        <div 
                                                            className="w-4 h-4 mx-auto flex items-center justify-center text-[10px]" 
                                                            title="Read-only access: you cannot perform actions on this task"
                                                        >
                                                            🔒
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-[#1A1A1A]">
                                                <div className="flex flex-col gap-0">
                                                    <span className="truncate max-w-sm text-[12px]">
                                                        {task.title}
                                                    </span>
                                                    {task.description && (
                                                        <span className="text-[10px] text-[#888883] truncate max-w-xs">
                                                            {task.description.replace(/<[^>]*>/g, "").trim()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                             <td 
                                                 className="py-2.5 px-3 text-center"
                                                 onClick={(e) => e.stopPropagation()}
                                             >
                                                 {!isObserver && (isLeader || task.createdById === currentUser.id || task.assignedToId === currentUser.id) ? (
                                                     <CustomSelect
                                                         options={columns.map((c) => ({
                                                             value: c.id,
                                                             label: c.name,
                                                         }))}
                                                         value={task.columnId}
                                                         onChange={(val) => handleUpdateStatus(task.id, val)}
                                                         className="w-28 mx-auto"
                                                     />
                                                 ) : (
                                                     <span className="border border-[#E5E5E3] px-2 py-0.5 rounded-[2px] text-[10px] font-medium text-[#1A1A1A]">
                                                         {task.column.name}
                                                     </span>
                                                 )}
                                             </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <span
                                                    className={`text-[10px] font-medium ${getPriorityDot(task.priority)}`}
                                                >
                                                    ● {task.priority}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-[11px] font-medium text-[#1A1A1A] tabular-nums">
                                                {task.dueDate
                                                    ? new Date(
                                                        task.dueDate,
                                                    ).toLocaleDateString()
                                                    : "—"}
                                            </td>
                                            <td className="py-2.5 px-3 text-[11px] text-[#1A1A1A]">
                                                {task.assignedTo.name}
                                            </td>
                                            <td className="py-2.5 px-3 text-center text-[11px] tabular-nums">
                                                {task.carryCount > 0 ? (
                                                    <span className="text-[#B08800] font-medium">
                                                        {task.carryCount}d
                                                    </span>
                                                ) : (
                                                    <span className="text-[#888883]">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
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
