"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import { getProjectPermissions } from "../../utils/projectPermissions";

interface ProjectSettingsViewProps {
    project: any;
    onRefresh?: (silent?: boolean) => void;
}

export default function ProjectSettingsView({ project }: ProjectSettingsViewProps) {
    const router = useRouter();
    const { currentUser, userRole, currentTeam } = useWorkspace();
    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const isProjectManager = permissions.isProjectManager;

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteProject = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }

        try {
            setIsDeleting(true);
            await api.deleteProject(project.id);
            toast.success("Project deleted successfully.");
            router.push("/projects");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete project.");
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 select-none bg-[var(--app-bg)]">
            <div className="max-w-2xl mx-auto w-full flex flex-col gap-5 pt-2">
                {/* Danger Zone */}
                {isProjectManager ? (
                    <div className="relative bg-[var(--app-card)] border border-[var(--color-error)]/30 corner-brackets rounded-[2px] overflow-hidden flex flex-col shadow-2xs">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-[var(--color-error)]/20 bg-[var(--color-error)]/5 flex items-center justify-between gap-3 min-h-[50px]">
                            <h3 className="text-[13px] font-semibold text-[var(--color-error)] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Danger Zone</span>
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="max-w-md">
                                <p className="text-[12px] font-semibold text-[var(--app-text)]">
                                    Delete Project
                                </p>
                                <p className="text-[11px] text-[var(--app-muted)] mt-1 leading-relaxed">
                                    Permanently remove <strong className="text-[var(--app-text)] font-semibold">{project.title || project.name}</strong> and all associated main tasks, subtasks, and comments. This action is irreversible.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleDeleteProject}
                                disabled={isDeleting}
                                className={`relative corner-brackets-4 px-3.5 py-1.5 text-[11px] font-medium rounded-[2px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border h-[32px] ${
                                    confirmDelete
                                        ? "bg-[var(--color-error)] text-white border-[var(--color-error)] font-bold animate-pulse"
                                        : "text-[var(--color-error)] hover:bg-[var(--color-error)]/10 border-[var(--color-error)]/30 hover:border-[var(--color-error)]"
                                }`}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                                <span>{confirmDelete ? "Confirm Delete Project?" : "Delete Project"}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] flex items-center gap-3 text-[var(--app-muted)]">
                        <ShieldAlert className="w-4 h-4 text-[var(--app-muted)] shrink-0" />
                        <p className="text-xs">
                            Project deletion and destructive settings are restricted to the Project Manager ({project.manager?.name || "Manager"}).
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
