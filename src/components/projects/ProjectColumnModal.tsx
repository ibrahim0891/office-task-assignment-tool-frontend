"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ModalWrapper from "../ui/ModalWrapper";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a column name.");
            return;
        }

        try {
            setLoading(true);
            await onSave(name.trim(), initialData?.type || "CUSTOM", initialData?.isComplete || false);
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to save column");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !initialData) return;
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
                <h3 className="text-xs font-semibold text-[var(--app-text)]">
                    {initialData?.id ? "Configure Column" : "Add Column"}
                </h3>
                <div className="flex items-center gap-1">
                    {isExistingColumn && onDelete && (
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

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--app-border)]">
                    <div>
                        {isExistingColumn && onDelete && (
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
