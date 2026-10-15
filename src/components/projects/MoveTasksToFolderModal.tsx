"use client";

import React, { useState } from "react";
import { Folder, X, Check, Loader2, ArrowRight } from "lucide-react";
import ModalWrapper from "../ui/ModalWrapper";
import { Button } from "../ui/Button";

interface MoveTasksToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskCount: number;
    folders: any[];
    onMove: (targetFolderId: string | null) => Promise<void>;
    onOpenManageFolders?: () => void;
}

export default function MoveTasksToFolderModal({
    isOpen,
    onClose,
    taskCount,
    folders,
    onMove,
    onOpenManageFolders,
}: MoveTasksToFolderModalProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
        folders.length > 0 ? folders[0].id : null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset selection when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedFolderId(folders.length > 0 ? folders[0].id : null);
            setIsSubmitting(false);
        }
    }, [isOpen, folders]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onMove(selectedFolderId);
            onClose();
        } catch {
            // Error handling done in parent
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
            <div className="flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--app-border)] bg-[var(--app-bg)]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[3px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center">
                            <Folder className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--app-text)]">
                                Move {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
                            </h3>
                            <p className="text-[11px] text-[var(--app-muted)]">
                                Select a destination folder or common space
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-[2px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body - Folder List */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-5 flex flex-col gap-2 overflow-y-auto max-h-[50vh]">
                        {/* Common Space Option */}
                        <label
                            onClick={() => setSelectedFolderId(null)}
                            className={`flex items-center justify-between p-3 rounded-[3px] border cursor-pointer transition-all ${
                                selectedFolderId === null
                                    ? "bg-[var(--color-accent)]/5 border-[var(--color-accent)] text-[var(--app-text)] ring-1 ring-[var(--color-accent)]/20"
                                    : "bg-[var(--app-card)] border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)]"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📋</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold">Common Space (No Folder)</span>
                                    <span className="text-[11px] text-[var(--app-muted)]">
                                        Tasks will be displayed outside any folder
                                    </span>
                                </div>
                            </div>
                            <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    selectedFolderId === null
                                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                                        : "border-[var(--app-border)] bg-[var(--app-card)]"
                                }`}
                            >
                                {selectedFolderId === null && <Check className="w-2.5 h-2.5" />}
                            </div>
                        </label>

                        {/* Project Folders */}
                        {folders.map((folder) => {
                            const isSelected = selectedFolderId === folder.id;
                            const taskCountInFolder = folder._count?.tasks || 0;
                            return (
                                <label
                                    key={folder.id}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={`flex items-center justify-between p-3 rounded-[3px] border cursor-pointer transition-all ${
                                        isSelected
                                            ? "bg-[var(--color-accent)]/5 border-[var(--color-accent)] text-[var(--app-text)] ring-1 ring-[var(--color-accent)]/20"
                                            : "bg-[var(--app-card)] border-[var(--app-border)] hover:bg-[var(--app-hover-bg)] text-[var(--app-text)]"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{folder.emoji || "📁"}</span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold">{folder.name}</span>
                                            {folder.description && (
                                                <span className="text-[11px] text-[var(--app-muted)] line-clamp-1">
                                                    {folder.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {taskCountInFolder > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-muted)] tabular-nums">
                                                {taskCountInFolder} {taskCountInFolder === 1 ? "task" : "tasks"}
                                            </span>
                                        )}
                                        <div
                                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                                isSelected
                                                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                                                    : "border-[var(--app-border)] bg-[var(--app-card)]"
                                            }`}
                                        >
                                            {isSelected && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}

                        {folders.length === 0 && (
                            <div className="p-4 rounded-[3px] border border-dashed border-[var(--app-border)] text-center text-xs text-[var(--app-muted)] mt-1">
                                No custom folders in this project yet.
                                {onOpenManageFolders && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onOpenManageFolders();
                                        }}
                                        className="block mx-auto mt-2 text-[var(--color-accent)] font-semibold hover:underline"
                                    >
                                        Create a folder first
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--app-border)] bg-[var(--app-bg)]">
                        {onOpenManageFolders ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenManageFolders();
                                }}
                                className="text-[11px] text-[var(--app-muted)] hover:text-[var(--app-text)] underline cursor-pointer"
                            >
                                Manage Folders
                            </button>
                        ) : (
                            <div />
                        )}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={isSubmitting}
                                icon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                            >
                                {isSubmitting ? "Moving..." : `Move ${taskCount} ${taskCount === 1 ? "Task" : "Tasks"}`}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </ModalWrapper>
    );
}
