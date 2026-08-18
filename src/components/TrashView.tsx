import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Task, User, api } from "../api";
import ConfirmDialog from "./ui/ConfirmDialog";
import { SkeletonList } from "./ui/SkeletonLoader";

interface TrashViewProps {
    teamId: string;
    currentUser: User;
    userRole: string;
    onRefreshWorkspace: () => void;
}

export default function TrashView({
    teamId,
    currentUser,
    userRole,
    onRefreshWorkspace,
}: TrashViewProps) {
    const [trashTasks, setTrashTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [taskToRestore, setTaskToRestore] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] =
        useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const loadTrashTasks = async () => {
        if (!teamId) return;
        setIsLoading(true);
        try {
            const data = await api.getTasks({
                teamId,
                archivedOrDeleted: true,
            }, currentUser.id);
            setTrashTasks(data);
        } catch (err: any) {
            toast.error(err.message || "Failed to load trash tasks.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTrashTasks();
    }, [teamId]);

    const handleRestoreTask = async () => {
        if (!taskToRestore) return;
        setActionLoading(true);
        try {
            await api.restoreTask(taskToRestore.id, currentUser.id);
            toast.success(`Restored "${taskToRestore.title}"`);
            setTaskToRestore(null);
            loadTrashTasks();
            onRefreshWorkspace();
        } catch (err: any) {
            toast.error(err.message || "Failed to restore task.");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePermanentDeleteTask = async () => {
        if (!taskToDelete) return;
        setActionLoading(true);
        try {
            await api.permanentlyDeleteTask(taskToDelete.id);
            toast.success(`Permanently deleted "${taskToDelete.title}"`);
            setTaskToDelete(null);
            loadTrashTasks();
            onRefreshWorkspace();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete task.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEmptyTrash = async () => {
        if (trashTasks.length === 0) return;
        setActionLoading(true);
        try {
            for (const task of trashTasks) {
                await api.permanentlyDeleteTask(task.id);
            }
            toast.success("Trash emptied successfully");
            setIsEmptyTrashConfirmOpen(false);
            loadTrashTasks();
            onRefreshWorkspace();
        } catch (err: any) {
            toast.error(err.message || "Failed to empty trash.");
        } finally {
            setActionLoading(false);
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return "text-[#CB2431] bg-[#CB2431]/10 border-[#CB2431]/20";
            case "HIGH":
                return "text-[#B08800] bg-[#B08800]/10 border-[#B08800]/20";
            case "MEDIUM":
                return "text-[#1A1A1A] bg-[#1A1A1A]/10 border-[#1A1A1A]/20";
            default:
                return "text-[#888883] bg-[#888883]/10 border-[#888883]/20";
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 p-5 bg-[#FAFAF9]">
                <SkeletonList />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-5 bg-[#FAFAF9] text-[#1A1A1A] flex flex-col gap-4 select-none">
            {/* Trash Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-[#E5E5E3] p-4 corner-brackets">
                <div>
                    <h1 className="font-heading text-xl flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-[#888883]" />
                        Trash & Archived Tasks
                    </h1>
                    <p className="text-[11px] text-[#888883] mt-0.5">
                        Manage soft-deleted and archived tasks. Restore them to
                        active boards or permanently purge them.
                    </p>
                </div>

                {trashTasks.length > 0 && (
                    <button
                        onClick={() => setIsEmptyTrashConfirmOpen(true)}
                        className="px-3.5 py-1.5 border border-[#CB2431]/30 bg-[#CB2431]/5 hover:bg-[#CB2431]/15 text-[#CB2431] rounded-[3px] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Empty Trash ({trashTasks.length})
                    </button>
                )}
            </div>

            {/* Trash Tasks List */}
            <div className="border border-[#E5E5E3] flex flex-col flex-1 corner-brackets overflow-hidden">
                {trashTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center my-auto gap-2">
                        <div className="w-12 h-12 rounded-full border border-[#E5E5E3] bg-[#FAFAF9] flex items-center justify-center text-[#888883] mb-1">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="font-heading text-base text-[#1A1A1A]">
                            Trash is empty
                        </h3>
                        <p className="text-[11px] text-[#888883] max-w-sm">
                            Archived or deleted tasks will appear here. No items
                            currently require restoration or deletion.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                                <tr className="border-b border-[#E5E5E3] bg-[#FAFAF9] text-xs text-[#888883] capitalize">
                                    <th className="py-2.5 px-4 font-medium">
                                        Task Title
                                    </th>
                                    <th className="py-2.5 px-3 font-medium">
                                        Column
                                    </th>
                                    <th className="py-2.5 px-3 font-medium">
                                        Priority
                                    </th>
                                    <th className="py-2.5 px-3 font-medium">
                                        Assignee
                                    </th>
                                    <th className="py-2.5 px-3 font-medium text-[#888883]">
                                        Status
                                    </th>
                                    <th className="py-2.5 px-4 font-medium text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5E3]">
                                {trashTasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        className="hover:bg-[#FAFAF9] transition-colors"
                                    >
                                        <td className="py-3 px-4 font-medium text-[#1A1A1A]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="truncate max-w-xs text-xs">
                                                    {task.title}
                                                </span>
                                                {task.description && (
                                                    <p className="text-[11px] text-[#888883] mt-0.5 line-clamp-2 leading-relaxed">
                                                        {task.description.replace(/<[^>]*>/g, "").trim()}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-[#888883] text-xs">
                                            {task.column?.name || "Unassigned"}
                                        </td>
                                        <td className="py-3 px-3">
                                            <span
                                                className={`px-1.5 py-0.5 border text-[10px] font-semibold rounded-[2px] ${getPriorityBadge(task.priority)}`}
                                            >
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-1.5">
                                                {task.assignedTo?.avatarUrl ? (
                                                    <img
                                                        src={
                                                            task.assignedTo
                                                                .avatarUrl
                                                        }
                                                        alt={
                                                            task.assignedTo.name
                                                        }
                                                        className="w-4 h-4 rounded-full object-cover border border-[#E5E5E3]"
                                                    />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-[2px] border border-[#DADAD6] bg-[#FAFAF9] flex items-center justify-center text-[7px] text-[#1A1A1A] font-semibold">
                                                        {task.assignedTo?.name
                                                            ? task.assignedTo.name
                                                                .split(" ")
                                                                .map(
                                                                    (n) =>
                                                                        n[0],
                                                                )
                                                                .join("")
                                                            : "U"}
                                                    </div>
                                                )}
                                                <span className="text-[#1A1A1A] truncate max-w-[100px]">
                                                    {task.assignedTo?.name ||
                                                        "Unassigned"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3">
                                            {task.isSoftDeleted ? (
                                                <span className="text-[#CB2431] bg-[#CB2431]/10 px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium">
                                                    Deleted
                                                </span>
                                            ) : (
                                                <span className="text-[#B08800] bg-[#B08800]/10 px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium">
                                                    Archived
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setTaskToRestore(task)
                                                    }
                                                    className="px-2.5 py-1 border border-[#E5E5E3] hover:bg-[#FAFAF9] text-[#1A1A1A] rounded-[3px] text-base font-medium transition-colors cursor-pointer flex items-center gap-1"
                                                    title="Restore to active board"
                                                >
                                                    <RotateCcw className="w-3 h-3 text-[#888883]" />
                                                    Restore
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setTaskToDelete(task)
                                                    }
                                                    className="px-2.5 py-1 border border-[#CB2431]/30 hover:bg-[#CB2431]/10 text-[#CB2431] rounded-[3px] text-base font-medium transition-colors cursor-pointer flex items-center gap-1"
                                                    title="Permanently delete task"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Custom Confirm Dialogs with Corner Marks */}
            <ConfirmDialog
                isOpen={!!taskToRestore}
                title="Restore Task"
                description={`Are you sure you want to restore "${taskToRestore?.title}" back to the active board?`}
                confirmText="Restore Task"
                cancelText="Cancel"
                isDanger={false}
                isLoading={actionLoading}
                onConfirm={handleRestoreTask}
                onClose={() => setTaskToRestore(null)}
            />

            <ConfirmDialog
                isOpen={!!taskToDelete}
                title="Permanently Delete Task"
                description={`Are you sure you want to permanently delete "${taskToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete Permanently"
                cancelText="Cancel"
                isDanger={true}
                isLoading={actionLoading}
                onConfirm={handlePermanentDeleteTask}
                onClose={() => setTaskToDelete(null)}
            />

            <ConfirmDialog
                isOpen={isEmptyTrashConfirmOpen}
                title="Empty Entire Trash"
                description={`Are you sure you want to permanently delete all ${trashTasks.length} items in the trash? This action cannot be undone.`}
                confirmText="Empty All"
                cancelText="Cancel"
                isDanger={true}
                isLoading={actionLoading}
                onConfirm={handleEmptyTrash}
                onClose={() => setIsEmptyTrashConfirmOpen(false)}
            />
        </div>
    );
}
