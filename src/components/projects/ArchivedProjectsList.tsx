"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FolderArchive, RotateCcw, Trash2, Folder, CheckCircle2, ShieldAlert } from "lucide-react";
import { api, User } from "../../api";
import { Button } from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { UserAvatar } from "../ui/UserAvatar";
import { SkeletonList } from "../ui/SkeletonLoader";

interface ArchivedProjectsListProps {
    teamId: string;
    currentUser: User;
    userRole: string;
    onCountChange?: (count: number) => void;
    onRefreshWorkspace?: () => void;
}

export default function ArchivedProjectsList({
    teamId,
    currentUser,
    userRole,
    onCountChange,
    onRefreshWorkspace,
}: ArchivedProjectsListProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projectToRestore, setProjectToRestore] = useState<any | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const isWorkspaceLeader = (userRole || "").toUpperCase() === "LEADER";

    const loadArchivedProjects = async () => {
        if (!teamId) return;
        setIsLoading(true);
        try {
            const data = await api.getArchivedProjects(teamId);
            setProjects(data);
            if (onCountChange) {
                onCountChange(data.length);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to load archived projects.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedProjects();
    }, [teamId]);

    const handleRestore = async () => {
        if (!projectToRestore) return;
        setActionLoading(true);
        try {
            await api.restoreProject(projectToRestore.id);
            toast.success(`Restored project "${projectToRestore.title}"`);
            setProjectToRestore(null);
            await loadArchivedProjects();
            if (onRefreshWorkspace) onRefreshWorkspace();
        } catch (err: any) {
            toast.error(err.message || "Failed to restore project.");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (!projectToDelete) return;
        setActionLoading(true);
        try {
            await api.permanentlyDeleteProject(projectToDelete.id);
            toast.success(`Permanently deleted "${projectToDelete.title}"`);
            setProjectToDelete(null);
            await loadArchivedProjects();
            if (onRefreshWorkspace) onRefreshWorkspace();
        } catch (err: any) {
            toast.error(err.message || "Failed to permanently delete project.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatArchivedDate = (dateVal?: string | null) => {
        if (!dateVal) return "Recently";
        try {
            const d = new Date(dateVal);
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "Recently";
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 bg-[var(--app-card)]">
                <SkeletonList />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center my-auto gap-2 bg-[var(--app-card)]">
                <div className="w-12 h-12 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-center text-[var(--app-muted)] mb-1">
                    <FolderArchive className="w-6 h-6" />
                </div>
                <h3 className="font-heading text-base text-[var(--app-text)] font-semibold">
                    No Archived Projects
                </h3>
                <p className="text-[11px] text-[var(--app-muted)] max-w-md leading-relaxed">
                    Soft-deleted projects will appear here. In accordance with workspace permissions, archived projects are visible only to the Project Manager and Workspace Owner.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 bg-[var(--app-card)]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                        <tr className="border-b border-[var(--app-border)] bg-[var(--app-bg)]/50 text-xs text-[var(--app-muted)] capitalize">
                            <th className="py-2.5 px-4 font-medium">Project</th>
                            <th className="py-2.5 px-3 font-medium">Folder</th>
                            <th className="py-2.5 px-3 font-medium">Manager</th>
                            <th className="py-2.5 px-3 font-medium">Tasks / Progress</th>
                            <th className="py-2.5 px-3 font-medium">Archived Date</th>
                            <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--app-border)]">
                        {projects.map((proj) => {
                            const isManager = proj.managerId === currentUser.id || proj.manager?.id === currentUser.id;
                            const canManage = isManager || isWorkspaceLeader;

                            return (
                                <tr
                                    key={proj.id}
                                    className="hover:bg-[var(--app-hover-bg)] transition-colors"
                                >
                                    {/* Project Title & Emoji */}
                                    <td className="py-3 px-4 font-medium text-[var(--app-text)]">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-base select-none">{proj.emoji || "📁"}</span>
                                            <div className="flex flex-col min-w-0">
                                                <span className="truncate max-w-xs text-xs font-semibold">
                                                    {proj.title}
                                                </span>
                                                {proj.description && (
                                                    <span className="text-[10px] text-[var(--app-muted)] truncate max-w-xs mt-0.5">
                                                        {proj.description.replace(/<[^>]*>/g, "").trim()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Folder */}
                                    <td className="py-3 px-3 text-[var(--app-muted)] text-xs">
                                        {proj.folder ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[10px]">
                                                <span>{proj.folder.emoji || "📁"}</span>
                                                <span className="truncate max-w-[120px]">{proj.folder.name}</span>
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-[var(--app-muted)] opacity-60">—</span>
                                        )}
                                    </td>

                                    {/* Project Manager */}
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-2">
                                            <UserAvatar
                                                name={proj.manager?.fullName || proj.manager?.name || "Manager"}
                                                avatarUrl={proj.manager?.avatarUrl}
                                                size="xs"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] text-[var(--app-text)] font-medium truncate max-w-[120px]">
                                                    {proj.manager?.fullName || proj.manager?.name || "Manager"}
                                                </span>
                                                {isManager && (
                                                    <span className="text-[9px] text-[var(--color-accent)] font-semibold">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Tasks / Progress */}
                                    <td className="py-3 px-3 text-[var(--app-text)]">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--app-muted)]">
                                                <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />
                                                <span>{proj.doneTasks || 0} / {proj.totalTasks || 0} tasks</span>
                                                <span>• {proj.progress || 0}%</span>
                                            </div>
                                            <div className="w-24 h-1.5 rounded-full bg-[var(--app-hover-bg)] overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--color-accent)] transition-all"
                                                    style={{ width: `${proj.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Archived Date */}
                                    <td className="py-3 px-3 text-[var(--app-muted)] text-[11px]">
                                        {formatArchivedDate(proj.deletedAt)}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4 text-right">
                                        {canManage ? (
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<RotateCcw className="w-3 h-3" />}
                                                    onClick={() => setProjectToRestore(proj)}
                                                    disabled={actionLoading}
                                                    title="Restore Project to Active Boards"
                                                >
                                                    Restore
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    icon={<Trash2 className="w-3 h-3" />}
                                                    onClick={() => setProjectToDelete(proj)}
                                                    disabled={actionLoading}
                                                    title="Permanently Delete Project"
                                                >
                                                    Purge
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-[var(--app-muted)] italic flex items-center justify-end gap-1">
                                                <ShieldAlert className="w-3 h-3" />
                                                Read only
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Confirm Permanent Delete Dialog */}
            <ConfirmDialog
                isOpen={Boolean(projectToDelete)}
                title="Permanently Delete Project?"
                description={`Are you sure you want to permanently delete "${projectToDelete?.title}"? All associated tasks, subtasks, kanban stages, comments, and project links will be permanently erased. This action CANNOT be undone.`}
                confirmText="Permanently Delete"
                cancelText="Cancel"
                isDanger={true}
                isLoading={actionLoading}
                onConfirm={handlePermanentDelete}
                onClose={() => setProjectToDelete(null)}
            />

            {/* Confirm Restore Dialog */}
            <ConfirmDialog
                isOpen={Boolean(projectToRestore)}
                title="Restore Project?"
                description={`Restore "${projectToRestore?.title}" back to active status? It will reappear on project boards and become visible to all assigned members.`}
                confirmText="Restore Project"
                cancelText="Cancel"
                isDanger={false}
                isLoading={actionLoading}
                onConfirm={handleRestore}
                onClose={() => setProjectToRestore(null)}
            />
        </div>
    );
}
