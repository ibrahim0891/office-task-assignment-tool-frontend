"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ProjectColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, type?: string, isComplete?: boolean) => Promise<void>;
    initialData?: { id?: string; name: string; type?: string; isComplete: boolean } | null;
}

export default function ProjectColumnModal({
    isOpen,
    onClose,
    onSave,
    initialData,
}: ProjectColumnModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
        } else {
            setName("");
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Column name is required");
            return;
        }

        try {
            setLoading(true);
            await onSave(name.trim());
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to save column");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-sm shadow-xl flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)]">
                    <h3 className="text-xs font-semibold text-[var(--app-text)] uppercase tracking-wider">
                        {initialData?.id ? "Configure Custom Column" : "Add Custom Column"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors p-1 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
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
                    <div className="flex justify-end gap-2 pt-3 border-t border-[var(--app-border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="relative corner-brackets-4 px-3.5 py-1.5 border border-[var(--app-border)] bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] text-[11px] font-medium text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
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
                </form>
            </div>
        </div>
    );
}
