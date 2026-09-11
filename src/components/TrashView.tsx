"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Trash2, RotateCcw, FolderArchive } from "lucide-react";
import { Task, User, api } from "../api";
import ConfirmDialog from "./ui/ConfirmDialog";
import { SkeletonList } from "./ui/SkeletonLoader";
import ArchivedProjectsList from "./projects/ArchivedProjectsList";

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
    const [activeTab, setActiveTab] = useState<"tasks" | "projects">(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("trash_active_tab");
                if (saved === "tasks" || saved === "projects") return saved;
            } catch {}
        }
        return "tasks";
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("trash_active_tab", activeTab);
            } catch {}
        }
    }, [activeTab]);
    const [trashTasks, setTrashTasks] = useState<Task[]>([]);
    const [archivedProjectsCount, setArchivedProjectsCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [taskToRestore, setTaskToRestore] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);
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

    const loadArchivedProjectsCount = async () => {
        if (!teamId) return;
        try {
            const data = await api.getArchivedProjects(teamId);
            setArchivedProjectsCount(data.length);
        } catch {
            // non-blocking
        }
    };

    useEffect(() => {
        loadTrashTasks();
        loadArchivedProjectsCount();
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
            await api.permanentlyDeleteTask(taskToDelete.id, currentUser?.id);
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
                await api.permanentlyDeleteTask(task.id, currentUser?.id);
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
                return "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20";
            case "HIGH":
                return "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20";
            case "MEDIUM":
                return "text-[var(--app-text)] bg-[var(--app-text)]/10 border-[var(--app-text)]/20";
            default:
                return "text-[var(--app-muted)] bg-[var(--app-muted)]/10 border-[var(--app-muted)]/20";
        }
    };

    if (isLoading && trashTasks.length === 0) {
        return (
            <div className="flex-1 p-5 bg-[var(--app-bg)]">
                <SkeletonList />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-5 bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col gap-4 select-none">
            {/* Archive Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-[var(--app-border)] bg-[var(--app-card)] p-4 corner-brackets">
                <div>
                    <h1 className="font-heading text-xl flex items-center gap-2 text-[var(--app-text)] font-bold">
                        <Trash2 className="w-5 h-5 text-[var(--app-muted)]" />
                        Trash & Workspace Archive
                    </h1>
                    <p className="text-[11px] text-[var(--app-muted)] mt-0.5">
                        Manage soft-deleted tasks and archived projects. Restore them to active workspaces or permanently purge them.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
                    {/* Segmented Tab Switcher */}
                    <div className="flex items-center p-0.5 rounded-[3px] bg-[var(--app-bg)] border border-[var(--app-border)] text-xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab("tasks")}
                            className={`px-3 py-1 rounded-[2px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "tasks"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs border border-[var(--app-border)] font-semibold"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <span>Tasks</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                activeTab === "tasks"
                                    ? "bg-[var(--app-hover-bg)] text-[var(--app-text)] font-bold"
                                    : "text-[var(--app-muted)]"
                            }`}>
                                {trashTasks.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("projects")}
                            className={`px-3 py-1 rounded-[2px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "projects"
                                    ? "bg-[var(--app-card)] text-[var(--app-text)] shadow-xs border border-[var(--app-border)] font-semibold"
                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            }`}
                        >
                            <FolderArchive className="w-3.5 h-3.5" />
                            <span>Projects</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                activeTab === "projects"
                                    ? "bg-[var(--app-hover-bg)] text-[var(--app-text)] font-bold"
                                    : "text-[var(--app-muted)]"
                            }`}>
                                {archivedProjectsCount}
                            </span>
                        </button>
                    </div>

                    {activeTab === "tasks" && trashTasks.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setIsEmptyTrashConfirmOpen(true)}
                            className="px-3.5 py-1.5 border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 hover:bg-[var(--color-error)]/15 text-[var(--color-error)] rounded-[3px] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Empty Tasks ({trashTasks.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Active Content: Projects or Tasks */}
            {activeTab === "projects" ? (
                <div className="border border-[var(--app-border)] flex flex-col flex-1 corner-brackets overflow-hidden">
                    <ArchivedProjectsList
                        teamId={teamId}
                        currentUser={currentUser}
                        userRole={userRole}
                        onCountChange={setArchivedProjectsCount}
                        onRefreshWorkspace={onRefreshWorkspace}
                    />
                </div>
            ) : (
                /* Trash Tasks List */
                <div className="border border-[var(--app-border)] bg-[var(--app-card)] flex flex-col flex-1 corner-brackets overflow-hidden">
                    {trashTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center my-auto gap-2">
                            <div className="w-12 h-12 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-center text-[var(--app-muted)] mb-1">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-heading text-base text-[var(--app-text)] font-semibold">
                                Task Trash is Empty
                            </h3>
                            <p className="text-[11px] text-[var(--app-muted)] max-w-sm">
                                Archived or deleted tasks will appear here. No items currently require restoration or deletion.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                    <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)]/50 text-xs text-[var(--app-muted)] capitalize">
                                        <th className="py-2.5 px-4 font-medium">Task Title</th>
                                        <th className="py-2.5 px-3 font-medium">Column</th>
                                        <th className="py-2.5 px-3 font-medium">Priority</th>
                                        <th className="py-2.5 px-3 font-medium">Assignee</th>
                                        <th className="py-2.5 px-3 font-medium text-[var(--app-muted)]">Status</th>
                                        <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--app-border)]">
                                    {trashTasks.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="hover:bg-[var(--app-hover-bg)] transition-colors"
                                        >
                                            <td className="py-3 px-4 font-medium text-[var(--app-text)]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="truncate max-w-xs text-xs">
                                                        {task.title}
                                                    </span>
                                                    {task.description && (
                                                        <p className="text-[11px] text-[var(--app-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                                                            {task.description.replace(/<[^>]*>/g, "").trim()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-[var(--app-muted)] text-xs">
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
                                                            src={task.assignedTo.avatarUrl}
                                                            alt={task.assignedTo.fullName}
                                                            className="w-4 h-4 rounded-full object-cover border border-[var(--app-border)]"
                                                        />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-[2px] border border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-center text-[7px] text-[var(--app-text)] font-semibold">
                                                            {task.assignedTo?.fullName
                                                                ? task.assignedTo.fullName
                                                                      .split(" ")
                                                                      .map((n) => n[0])
                                                                      .join("")
                                                                : "U"}
                                                        </div>
                                                    )}
                                                    <span className="text-[var(--app-text)] truncate max-w-[100px]">
                                                        {task.assignedTo?.fullName || "Unassigned"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {task.isSoftDeleted ? (
                                                    <span className="text-[var(--color-error)] bg-[var(--color-error)]/10 px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium">
                                                        Deleted
                                                    </span>
                                                ) : (
                                                    <span className="text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium">
                                                        Archived
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setTaskToRestore(task)}
                                                        className="px-2.5 py-1 border border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] rounded-[3px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                                                        title="Restore to active board"
                                                    >
                                                        <RotateCcw className="w-3 h-3 text-[var(--app-muted)]" />
                                                        Restore
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTaskToDelete(task)}
                                                        className="px-2.5 py-1 border border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-[3px] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
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
            )}

            {/* Custom Confirm Dialogs */}
            <ConfirmDialog
                isOpen={Boolean(taskToRestore)}
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
                isOpen={Boolean(taskToDelete)}
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
                title="Empty Entire Task Trash"
                description={`Are you sure you want to permanently delete all ${trashTasks.length} items in the task trash? This action cannot be undone.`}
                confirmText="Empty All Tasks"
                cancelText="Cancel"
                isDanger={true}
                isLoading={actionLoading}
                onConfirm={handleEmptyTrash}
                onClose={() => setIsEmptyTrashConfirmOpen(false)}
            />
        </div>
    );
}
