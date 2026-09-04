"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Trash2, Shield, Check, Layers, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import ModalWrapper from "../ui/ModalWrapper";
import { STAGE_TAG_OPTIONS, getStageMeta, isSystemColumn } from "../../utils/projectProgress";

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
    const [selectedTag, setSelectedTag] = useState<string>("TODO");
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            const meta = getStageMeta(initialData);
            setSelectedTag(meta.tagId || "TODO");
        } else {
            setName("");
            setSelectedTag("TODO");
        }
    }, [initialData, isOpen]);

    const isSystem = isSystemColumn(initialData);
    const activeStage = STAGE_TAG_OPTIONS.find((s) => s.id === selectedTag) || STAGE_TAG_OPTIONS[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a column name.");
            return;
        }

        try {
            setLoading(true);
            const isComplete = selectedTag === "DONE";
            await onSave(
                name.trim(), 
                selectedTag, 
                isComplete
            );
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
            maxWidth="max-w-lg"
        >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--app-border)] bg-[var(--app-card)] select-none">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[var(--app-text)]">
                        {initialData?.id ? "Configure Workflow Column" : "Add Workflow Column"}
                    </h3>
                    {isSystem && (
                        <span className="text-[9px] font-medium bg-[var(--app-bg)] text-[var(--app-muted)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-[var(--app-muted)]" />
                            Core Stage
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
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5 bg-[var(--app-card)] text-[var(--app-text)]">
                {/* 1. Column Title */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-[var(--app-text)] flex items-center justify-between">
                        <span>Column Title <span className="text-[var(--color-error)]">*</span></span>
                        <span className="text-[10px] text-[var(--app-muted)] font-normal">Customizable name for Kanban board</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Backlog, Figma Specs, Development, QA Review, Released..."
                        autoFocus
                        className="px-3 py-2 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[3px] focus:outline-none focus:border-[var(--app-border-strong)] transition-colors"
                    />
                </div>

                {/* 2. Assign Workflow Stage Tag */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[var(--app-text)]">
                            Assign Workflow Stage Tag <span className="text-[var(--color-error)]">*</span>
                        </label>
                        <span className="text-[10px] text-[var(--app-muted)]">
                            Select one of 4 workflow categories
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {STAGE_TAG_OPTIONS.map((option) => {
                            const isSelected = selectedTag === option.id;
                            return (
                                <div
                                    key={option.id}
                                    onClick={() => setSelectedTag(option.id)}
                                    className={`p-3 rounded-[3px] border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                        isSelected
                                            ? "bg-[var(--app-bg)] border-[var(--app-text)] shadow-xs"
                                            : "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border-[var(--app-border)]"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-[2px] border flex items-center gap-1.5 ${option.color} ${option.bg} ${option.border}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${option.dot}`} />
                                            <span>{option.shortLabel}</span>
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-[var(--app-text)] tabular-nums">
                                                {option.weight}%
                                            </span>
                                            {isSelected && (
                                                <div className="w-3.5 h-3.5 rounded-full bg-[var(--app-text)] text-[var(--app-card)] flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[var(--app-muted)] leading-relaxed">
                                        {option.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Live Preview Bar */}
                <div className="bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] p-3 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--app-muted)] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                        <span>Calculated Progress Weight:</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--app-text)]">{activeStage.label}</span>
                        <span className="text-[10.5px] font-bold bg-[var(--app-card)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] text-[var(--app-text)] tabular-nums">
                            {activeStage.weight}%
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--app-border)]">
                    <div>
                        {isExistingColumn && onDelete && !isSystem && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading || isDeleting}
                                className="text-[10.5px] text-[var(--color-error)] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                            className="relative corner-brackets-4 px-4 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
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
