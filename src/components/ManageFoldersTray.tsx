"use client";

import React, { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { Folder, FolderPlus, Trash2, Edit2, Check, X, Loader2 } from "lucide-react";
import { api } from "../api";
import toast from "react-hot-toast";
import { EmojiPicker } from "./ui/EmojiPicker";

interface ManageFoldersTrayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ManageFoldersTray({ isOpen, onClose }: ManageFoldersTrayProps) {
    const {
        folders,
        isFoldersLoading,
        handleCreateFolder,
        handleUpdateFolder,
        handleDeleteFolder,
        loadProjects,
        loadFolders,
        userRole,
    } = useWorkspace();

    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderEmoji, setNewFolderEmoji] = useState("📁");
    const [isCreating, setIsCreating] = useState(false);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingEmoji, setEditingEmoji] = useState("📁");
    const [isUpdating, setIsUpdating] = useState(false);
    const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
    const [movingProjectId, setMovingProjectId] = useState<string | null>(null);

    const isLeader = userRole === "LEADER";

    const onCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setIsCreating(true);
        try {
            await handleCreateFolder(newFolderName.trim(), newFolderEmoji);
            setNewFolderName("");
            setNewFolderEmoji("📁");
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const onStartEdit = (folder: any) => {
        setEditingFolderId(folder.id);
        setEditingName(folder.name);
        setEditingEmoji(folder.emoji || "📁");
    };

    const onCancelEdit = () => {
        setEditingFolderId(null);
        setEditingName("");
        setEditingEmoji("📁");
    };

    const onSaveEdit = async (folderId: string) => {
        if (!editingName.trim()) return;
        setIsUpdating(true);
        try {
            await handleUpdateFolder(folderId, editingName.trim(), editingEmoji);
            setEditingFolderId(null);
            setEditingName("");
            setEditingEmoji("📁");
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    const onDelete = async (folderId: string) => {
        setDeletingFolderId(folderId);
        try {
            await handleDeleteFolder(folderId);
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingFolderId(null);
        }
    };

    const handleMoveProject = async (projectId: string, targetFolderId: string) => {
        setMovingProjectId(projectId);
        try {
            await api.updateProject(projectId, { folderId: targetFolderId });
            toast.success("Project moved successfully!");
            await loadFolders();
            await loadProjects();
        } catch (err: any) {
            toast.error(err.message || "Failed to move project");
        } finally {
            setMovingProjectId(null);
        }
    };

    // Oldest folder is the default one and cannot be deleted
    const defaultFolder = folders[0];

    return (
        <aside
            className={`shrink-0 bg-[var(--app-card)] flex flex-col h-full select-none transition-all duration-300 ease-in-out overflow-hidden ${
                isOpen 
                    ? "w-80 border-l border-[var(--app-border)]" 
                    : "w-0 border-l-0 border-transparent pointer-events-none"
            }`}
        >
            <div className="w-80 h-full flex flex-col overflow-hidden shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-[var(--app-border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-[var(--app-text)] shrink-0" />
                        <h2 className="font-heading text-xs font-semibold text-[var(--app-text)]">Manage Folders</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors text-base px-1.5 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Create folder form (Leader only) */}
                {isLeader && (
                    <form onSubmit={onCreate} className="p-4 border-b border-[var(--app-border)] flex items-end gap-2 shrink-0">
                        <div className="flex flex-col gap-1 shrink-0">
                            <span className="eyebrow">Icon</span>
                            <EmojiPicker
                                value={newFolderEmoji}
                                onChange={setNewFolderEmoji}
                                disabled={isCreating}
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="eyebrow">Folder Name</span>
                            <input
                                type="text"
                                placeholder="Name..."
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="px-2.5 py-1.5 border border-[var(--app-border)] focus:border-[var(--app-text)] focus:outline-none text-[11px] bg-[var(--app-bg)] text-[var(--app-text)] rounded-[3px] transition-colors w-full h-[46px]"
                                disabled={isCreating}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="relative corner-brackets-4 px-3 h-[46px] border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)] text-[11px] font-medium rounded-[2px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                        >
                            {isCreating ? (
                                <Loader2 className="w-3 h-3 animate-spin text-[var(--app-text)]" />
                            ) : (
                                <FolderPlus className="w-3.5 h-3.5" />
                            )}
                            <span>Add</span>
                        </button>
                    </form>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {isFoldersLoading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-[var(--app-muted)] gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--app-text)]" />
                            <p className="text-xs font-medium">Loading folders...</p>
                        </div>
                    ) : folders.length === 0 ? (
                        <div className="flex justify-center py-12 text-[var(--app-muted)] text-xs">
                            No folders found.
                        </div>
                    ) : (
                        folders.map((folder) => {
                            const isDefault = defaultFolder?.id === folder.id;
                            const folderProjects = folder.projects || [];
                            const isEditing = editingFolderId === folder.id;

                            return (
                                <div
                                    key={folder.id}
                                    className="border border-[var(--app-border)] rounded-[3px] bg-[var(--app-bg)] p-3 flex flex-col gap-2.5"
                                >
                                    {/* Folder Header */}
                                    <div className="flex items-center justify-between gap-2">
                                        {isEditing ? (
                                            <div className="flex items-end gap-1.5 flex-1 min-w-0">
                                                <div className="shrink-0 flex flex-col gap-0.5">
                                                    <EmojiPicker
                                                        value={editingEmoji}
                                                        onChange={setEditingEmoji}
                                                        disabled={isUpdating}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="px-2 py-1 border border-[var(--app-border)] focus:border-[var(--app-text)] focus:outline-none text-[11px] bg-[var(--app-card)] text-[var(--app-text)] rounded-[2px] w-full h-[46px]"
                                                    disabled={isUpdating}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => onSaveEdit(folder.id)}
                                                    disabled={isUpdating}
                                                    className="text-green-600 hover:text-green-700 p-1 cursor-pointer disabled:opacity-50 self-center"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={onCancelEdit}
                                                    disabled={isUpdating}
                                                    className="text-red-500 hover:text-red-600 p-1 cursor-pointer disabled:opacity-50 self-center"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="text-base shrink-0 emoji-font">{folder.emoji || "📁"}</span>
                                                <span className="font-heading text-xs font-semibold truncate text-[var(--app-text)]">
                                                    {folder.name}
                                                </span>
                                                {isDefault && (
                                                    <span className="text-[9px] bg-[var(--app-border)] text-[var(--app-muted)] px-1 rounded-[1.5px] uppercase shrink-0 font-medium">
                                                        Default
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-[var(--app-muted)] shrink-0">
                                                    ({folderProjects.length})
                                                </span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {isLeader && !isEditing && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onStartEdit(folder)}
                                                    className="text-[var(--app-muted)] hover:text-[var(--app-text)] p-1 rounded hover:bg-[var(--app-card)] border border-transparent hover:border-[var(--app-border)] cursor-pointer"
                                                    title="Rename/Change icon"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                {!isDefault && (
                                                    <button
                                                        onClick={() => onDelete(folder.id)}
                                                        disabled={deletingFolderId === folder.id}
                                                        className="text-[var(--app-muted)] hover:text-[var(--color-error)] p-1 rounded hover:bg-[var(--color-error)]/10 border border-transparent hover:border-[var(--color-error)]/20 cursor-pointer disabled:opacity-50"
                                                        title="Delete Folder (Projects move to default)"
                                                    >
                                                        {deletingFolderId === folder.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Projects inside Folder */}
                                    <div className="border-t border-[var(--app-border)]/60 pt-2.5 flex flex-col gap-1.5">
                                        {folderProjects.length === 0 ? (
                                            <span className="text-[10px] text-[var(--app-muted)] italic pl-1">
                                                No projects in this folder
                                            </span>
                                        ) : (
                                            folderProjects.map((project: any) => (
                                                <div
                                                    key={project.id}
                                                    className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-2 py-1.5 flex items-center justify-between gap-2.5 text-[11px]"
                                                >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span>{project.emoji || "📁"}</span>
                                                        <span className="font-medium text-[var(--app-text)] truncate">
                                                            {project.title}
                                                        </span>
                                                    </div>

                                                    {/* Move Dropdown */}
                                                    {isLeader && (
                                                        <div className="flex items-center gap-1 shrink-0 relative">
                                                            {movingProjectId === project.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin text-[var(--app-muted)]" />
                                                            ) : (
                                                                <select
                                                                    value={folder.id}
                                                                    onChange={(e) =>
                                                                        handleMoveProject(
                                                                            project.id,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className="text-[9px] font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)] bg-transparent border-none outline-none cursor-pointer max-w-[80px] focus:ring-0 select-none"
                                                                >
                                                                    {folders.map((f) => (
                                                                        <option
                                                                            key={f.id}
                                                                            value={f.id}
                                                                            disabled={f.id === folder.id}
                                                                        >
                                                                            Move to: {f.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </aside>
    );
}
