"use client";

import React, { useState } from "react";
import { Folder, FolderPlus, Trash2, Edit2, Check, X, Loader2, Info, Layers, AlertTriangle } from "lucide-react";
import SideSheetWrapper from "../ui/SideSheetWrapper";
import { EmojiPicker } from "../ui/EmojiPicker";
import { Button } from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { api } from "../../api";
import toast from "react-hot-toast";

interface ManageProjectTaskFoldersDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    folders: any[];
    canManage: boolean;
    onFoldersUpdated: () => void;
}

export default function ManageProjectTaskFoldersDrawer({
    isOpen,
    onClose,
    projectId,
    folders = [],
    canManage = true,
    onFoldersUpdated,
}: ManageProjectTaskFoldersDrawerProps) {
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderEmoji, setNewFolderEmoji] = useState("📁");
    const [isCreating, setIsCreating] = useState(false);

    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingEmoji, setEditingEmoji] = useState("📁");
    const [isUpdating, setIsUpdating] = useState(false);

    const [deletingFolder, setDeletingFolder] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim() || !projectId) return;

        setIsCreating(true);
        try {
            await api.createProjectTaskFolder(projectId, {
                name: newFolderName.trim(),
                emoji: newFolderEmoji || "📁",
            });
            toast.success("Folder created successfully");
            setNewFolderName("");
            setNewFolderEmoji("📁");
            onFoldersUpdated();
        } catch (err: any) {
            toast.error(err.message || "Failed to create folder");
        } finally {
            setIsCreating(false);
        }
    };

    const handleStartEdit = (folder: any) => {
        setEditingFolderId(folder.id);
        setEditingName(folder.name);
        setEditingEmoji(folder.emoji || "📁");
    };

    const handleCancelEdit = () => {
        setEditingFolderId(null);
        setEditingName("");
        setEditingEmoji("📁");
    };

    const handleSaveEdit = async (folderId: string) => {
        if (!editingName.trim() || !projectId) return;

        setIsUpdating(true);
        try {
            await api.updateProjectTaskFolder(projectId, folderId, {
                name: editingName.trim(),
                emoji: editingEmoji || "📁",
            });
            toast.success("Folder updated");
            setEditingFolderId(null);
            setEditingName("");
            setEditingEmoji("📁");
            onFoldersUpdated();
        } catch (err: any) {
            toast.error(err.message || "Failed to update folder");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingFolder || !projectId) return;

        setIsDeleting(true);
        try {
            await api.deleteProjectTaskFolder(projectId, deletingFolder.id);
            toast.success("Folder removed. Any tasks inside were moved to common space.");
            setDeletingFolder(null);
            onFoldersUpdated();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete folder");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <SideSheetWrapper isOpen={isOpen} onClose={onClose} width="lg">
                <div className="flex flex-col h-full bg-[var(--app-card)] text-[var(--app-text)]">
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--app-border)] flex items-center justify-between shrink-0 bg-[var(--app-card)]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-[var(--app-hover-bg)] flex items-center justify-center border border-[var(--app-border)]">
                                <Folder className="w-4.5 h-4.5 text-[var(--app-text)]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold text-[var(--app-text)]">Main Task Folders</h2>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)]">
                                        {folders.length} {folders.length === 1 ? "folder" : "folders"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[var(--app-muted)] mt-0.5">
                                    Group main tasks into dedicated folders for cleaner organization.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] rounded-[3px] transition-colors cursor-pointer"
                            aria-label="Close drawer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Notice Callout */}
                    <div className="px-5 py-3 bg-[var(--app-hover-bg)]/50 border-b border-[var(--app-border)] flex items-start gap-2.5 shrink-0 text-[11px] text-[var(--app-muted)]">
                        <Info className="w-3.5 h-3.5 text-[var(--app-primary,#3B82F6)] mt-0.5 shrink-0" />
                        <span>
                            Tasks can live inside folders or stay in the common non-folder space. If you delete a folder, its tasks are safely preserved and returned to the common space.
                        </span>
                    </div>

                    {/* Create New Folder Form (If permission granted) */}
                    {canManage && (
                        <div className="p-5 border-b border-[var(--app-border)] bg-[var(--app-bg)]/40 shrink-0">
                            <h3 className="text-xs font-semibold text-[var(--app-text)] mb-3 flex items-center gap-2">
                                <FolderPlus className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                Create New Folder
                            </h3>
                            <form onSubmit={handleCreateFolder} className="flex items-end gap-2.5">
                                <div className="flex flex-col gap-1 shrink-0">
                                    <label className="text-[10px] font-medium text-[var(--app-muted)] uppercase tracking-wider">
                                        Emoji
                                    </label>
                                    <EmojiPicker
                                        value={newFolderEmoji}
                                        onChange={setNewFolderEmoji}
                                        disabled={isCreating}
                                    />
                                </div>
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <label className="text-[10px] font-medium text-[var(--app-muted)] uppercase tracking-wider">
                                        Folder Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Authentication, Billing, Q3 Launch..."
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        disabled={isCreating}
                                        className="h-[46px] px-3 text-xs bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:border-[var(--app-primary,#3B82F6)] transition-colors w-full"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isCreating || !newFolderName.trim()}
                                    className="h-[46px] px-4 text-xs shrink-0"
                                >
                                    {isCreating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Add Folder"
                                    )}
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* Folder List */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-medium text-[var(--app-muted)] uppercase tracking-wider">
                                Project Folders
                            </span>
                            <span className="text-[11px] text-[var(--app-muted)]">
                                {folders.length === 0 ? "No folders created yet" : `${folders.length} active`}
                            </span>
                        </div>

                        {folders.length === 0 ? (
                            <div className="py-12 px-4 text-center border border-dashed border-[var(--app-border)] rounded-[4px] bg-[var(--app-card)]">
                                <div className="w-10 h-10 rounded-full bg-[var(--app-hover-bg)] flex items-center justify-center mx-auto mb-3 text-[var(--app-muted)]">
                                    <Folder className="w-5 h-5 opacity-60" />
                                </div>
                                <p className="text-xs font-medium text-[var(--app-text)]">No Folders Created Yet</p>
                                <p className="text-[11px] text-[var(--app-muted)] max-w-sm mx-auto mt-1">
                                    By default, all tasks are kept in the common space. Create folders anytime to categorize and group tasks as your project grows.
                                </p>
                            </div>
                        ) : (
                            folders.map((folder) => {
                                const isEditing = editingFolderId === folder.id;
                                const taskCount = folder._count?.tasks || folder.tasks?.length || 0;

                                if (isEditing) {
                                    return (
                                        <div
                                            key={folder.id}
                                            className="p-3 bg-[var(--app-hover-bg)] border border-[var(--app-primary,#3B82F6)]/50 rounded-[4px] flex items-center gap-2"
                                        >
                                            <EmojiPicker
                                                value={editingEmoji}
                                                onChange={setEditingEmoji}
                                                disabled={isUpdating}
                                            />
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                disabled={isUpdating}
                                                className="flex-1 h-[46px] px-3 text-xs bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-primary,#3B82F6)]"
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveEdit(folder.id)}
                                                    disabled={isUpdating || !editingName.trim()}
                                                    className="p-2 bg-[var(--app-primary,#3B82F6)] text-white rounded-[3px] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                                                    title="Save"
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    disabled={isUpdating}
                                                    className="p-2 bg-[var(--app-card)] text-[var(--app-muted)] hover:text-[var(--app-text)] border border-[var(--app-border)] rounded-[3px] transition-colors cursor-pointer"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={folder.id}
                                        className="group p-3 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] rounded-[4px] flex items-center justify-between gap-3 transition-colors shadow-xs"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xl shrink-0 select-none">{folder.emoji || "📁"}</span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                    {folder.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--app-muted)]">
                                                        <Layers className="w-3 h-3 opacity-70" />
                                                        {taskCount} {taskCount === 1 ? "main task" : "main tasks"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {canManage && (
                                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(folder)}
                                                    className="p-1.5 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-card)] border border-transparent hover:border-[var(--app-border)] rounded-[3px] transition-all cursor-pointer"
                                                    title="Edit folder"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingFolder(folder)}
                                                    className="p-1.5 text-[var(--app-muted)] hover:text-[var(--color-error,#EF4444)] hover:bg-[var(--color-error,#EF4444)]/10 border border-transparent hover:border-[var(--color-error,#EF4444)]/20 rounded-[3px] transition-all cursor-pointer"
                                                    title="Delete folder"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[var(--app-border)] flex items-center justify-between shrink-0 bg-[var(--app-card)]">
                        <span className="text-[11px] text-[var(--app-muted)]">
                            {folders.length} {folders.length === 1 ? "folder configured" : "folders configured"}
                        </span>
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Done
                        </Button>
                    </div>
                </div>
            </SideSheetWrapper>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={Boolean(deletingFolder)}
                title={`Delete folder "${deletingFolder?.name}"?`}
                description="Are you sure you want to delete this folder? Any main tasks currently inside this folder will NOT be deleted; they will be safely moved to the common non-folder space."
                confirmText="Delete Folder"
                isDanger={true}
                isLoading={isDeleting}
                onConfirm={handleConfirmDelete}
                onClose={() => setDeletingFolder(null)}
            />
        </>
    );
}
