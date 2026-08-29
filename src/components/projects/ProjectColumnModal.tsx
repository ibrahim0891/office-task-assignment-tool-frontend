"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Trash2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import ModalWrapper from "../ui/ModalWrapper";
import { getStageMeta, isSystemColumn } from "../../utils/projectProgress";

interface ProjectColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, type?: string, isComplete?: boolean) => Promise<void>;
    onDelete?: (column: any) => Promise<void>;
    initialData?: {
        id?: string;
        name: string;
        type?: string;
        isComplete?: boolean;
    } | null;
}

export default function ProjectColumnModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
}: ProjectColumnModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
        } else {
            setName("");
        }
    }, [initialData, isOpen]);

    const isSystem = isSystemColumn(initialData);
    const stageMeta = initialData ? getStageMeta(initialData) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a column name.");
            return;
        }

        try {
            setLoading(true);
            await onSave(name.trim(), initialData?.type || (isSystem ? "SYSTEM" : "CUSTOM"), initialData?.isComplete || false);
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to save column");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !initialData || isSystem) return;
        try {
            setIsDeleting(true);
            await onDelete(initialData);
            onClose();
        } catch (err: any) {
            // error handled by caller
        } finally {
            setIsDeleting(false);
        }
    };

    const isExistingColumn = Boolean(initialData?.id);

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
        >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)]">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[var(--app-text)]">
                        {initialData?.id ? "Configure Column" : "Add Column"}
                    </h3>
                    {isSystem && (
                        <span className="text-[9px] font-medium bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-[var(--app-muted)]" />
                            System Stage
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {isExistingColumn && onDelete && !isSystem && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading || isDeleting}
                            className="p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete column"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors p-1 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium text-[var(--app-text)]">
                        Column Name <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. QA / Testing, Code Review..."
                        autoFocus
                        className="px-3 py-1.5 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none focus:border-[var(--app-border-strong)]"
                    />
                </div>

                {stageMeta && (
                    <div className="bg-[var(--app-bg)] border border-[var(--app-border)] p-2.5 rounded-[2px] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--app-muted)]">Workflow Stage:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[var(--app-text)]">{stageMeta.label}</span>
                            <span className="text-[10px] font-medium bg-[var(--app-card)] px-1.5 py-0.5 rounded-[2px] border border-[var(--app-border)] text-[var(--app-text)] tabular-nums">
                                {stageMeta.weight}% progress
                            </span>
                        </div>
                    </div>
                )}

                {isSystem && (
                    <p className="text-[10px] text-[var(--app-muted)] leading-relaxed italic">
                        This is a core workflow stage. You can rename its display label and drag to reorder it, but it cannot be deleted to preserve calculation integrity.
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--app-border)]">
                    <div>
                        {isExistingColumn && onDelete && !isSystem && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading || isDeleting}
                                className="text-[10px] text-[var(--color-error)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Column</span>
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading || isDeleting}
                            className="relative corner-brackets-4 px-3.5 py-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[11px] font-medium text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isDeleting}
                            className="relative corner-brackets-4 px-4 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[var(--app-text)]" />
                            ) : (
                                <span className="w-1.5 h-1.5 bg-[var(--app-text)] rounded-[0.5px] inline-block" />
                            )}
                            <span>{initialData?.id ? "Save Changes" : "Create Column"}</span>
                        </button>
                    </div>
                </div>
            </form>
        </ModalWrapper>
    );
}
