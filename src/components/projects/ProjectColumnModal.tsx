"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Trash2, Shield, Scale, ExternalLink, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import ModalWrapper from "../ui/ModalWrapper";
import { Checkbox } from "../ui/Checkbox";
import { STAGE_TAG_OPTIONS, getStageMeta, isSystemColumn, getStageWeight } from "../../utils/projectProgress";

interface ProjectColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, type?: string, isComplete?: boolean) => Promise<void>;
    onDelete?: (column: any) => Promise<void>;
    onOpenWeightManager?: () => void;
    initialData?: {
        id?: string;
        name: string;
        type?: string;
        isComplete?: boolean;
        weight?: number | null;
    } | null;
}

export default function ProjectColumnModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    onOpenWeightManager,
    initialData,
}: ProjectColumnModalProps) {
    const [name, setName] = useState("");
    const [isNoStage, setIsNoStage] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string>("TODO");
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isExistingColumn = Boolean(initialData?.id);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            const rawType = (initialData.type || "").toUpperCase();
            const meta = getStageMeta(initialData);
            const isUnweighted = (rawType === "CUSTOM" || rawType === "UNWEIGHTED") && !initialData.isComplete && !initialData.weight;
            setIsNoStage(isUnweighted);
            setSelectedTag(isUnweighted ? "TODO" : (meta.tagId || "TODO"));
        } else {
            setName("");
            setIsNoStage(false);
            setSelectedTag("TODO");
        }
    }, [initialData, isOpen]);

    const isSystem = isSystemColumn(initialData);
    const currentWeight = initialData ? getStageWeight(initialData) : 0;
    const stageMeta = initialData ? getStageMeta(initialData) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter a column name.");
            return;
        }

        try {
            setLoading(true);
            if (isExistingColumn) {
                // When editing an existing column, only update its name
                await onSave(name.trim(), initialData?.type, initialData?.isComplete);
            } else {
                // When creating a new column
                const targetType = isNoStage
                    ? "CUSTOM"
                    : (selectedTag === "DONE" ? "COMPLETED" : selectedTag === "IN_REVIEW" ? "NEED_ATTENTION" : selectedTag);
                const isComplete = !isNoStage && (selectedTag === "DONE" || selectedTag === "COMPLETED");

                await onSave(
                    name.trim(), 
                    targetType, 
                    isComplete
                );
            }
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

    const hasChanges = React.useMemo(() => {
        if (!initialData) {
            return Boolean(name.trim());
        }
        const initialName = (initialData.name || "").trim();
        return name.trim() !== initialName;
    }, [initialData, name]);

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
        >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--app-border)] bg-[var(--app-card)] select-none">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[2px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center">
                        <Edit3 className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--app-text)]">
                        {isExistingColumn ? "Rename Workflow Column" : "Add Workflow Column"}
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
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 bg-[var(--app-card)] text-[var(--app-text)]">
                {/* 1. Column Title Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-[var(--app-text)] flex items-center justify-between">
                        <span>Column Title <span className="text-[var(--color-error)]">*</span></span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Backlog, In Development, QA Review, Completed..."
                        autoFocus
                        disabled={loading || isDeleting}
                        className="px-3 py-2 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[3px] focus:outline-none focus:border-[var(--app-border-strong)] transition-colors"
                    />
                </div>

                {/* 2. For Existing Column: Info Card & Direct Link to Central Weight Manager */}
                {isExistingColumn ? (
                    <div className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--app-muted)] flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                                <span>Current Progress Contribution:</span>
                            </span>
                            <span className="font-bold text-[var(--app-text)] bg-[var(--app-card)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] tabular-nums">
                                {stageMeta?.label || `${currentWeight}%`}
                            </span>
                        </div>

                        {onOpenWeightManager && (
                            <div className="pt-2 border-t border-[var(--app-border)]/60 flex items-center justify-between">
                                <span className="text-[10.5px] text-[var(--app-muted)]">
                                    Need to adjust column weights or presets?
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenWeightManager();
                                    }}
                                    className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Manage All Weights</span>
                                    <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* 3. For New Column Creation: Option to set initial stage or unweighted */
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 rounded-[3px] bg-[var(--app-bg)] border border-[var(--app-border)] select-none">
                            <div className="flex flex-col gap-0.5 pr-3">
                                <label htmlFor="no-stage-toggle" className="text-xs font-semibold text-[var(--app-text)] cursor-pointer">
                                    Weightless Stage (0%)
                                </label>
                                <span className="text-[10.5px] text-[var(--app-muted)]">
                                    Do not assign progress completion weight to subtasks in this column
                                </span>
                            </div>
                            <Checkbox
                                id="no-stage-toggle"
                                checked={isNoStage}
                                onChange={(checked) => setIsNoStage(checked)}
                            />
                        </div>

                        {onOpenWeightManager && (
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenWeightManager();
                                    }}
                                    className="text-[10.5px] text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Scale className="w-3 h-3" />
                                    <span>Open Central Weight Manager</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                            disabled={loading || isDeleting || !name.trim()}
                            className={`relative corner-brackets-4 px-4 py-1.5 font-semibold text-[11px] rounded-[2px] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${
                                hasChanges
                                    ? "bg-[var(--color-accent)] border border-[var(--color-accent)] text-white hover:opacity-90 font-bold"
                                    : "bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)]"
                            }`}
                        >
                            {loading ? (
                                <Loader2 className={`w-3.5 h-3.5 animate-spin shrink-0 ${hasChanges ? "text-white" : "text-[var(--app-text)]"}`} />
                            ) : (
                                <span className={`w-1.5 h-1.5 rounded-[0.5px] inline-block ${hasChanges ? "bg-white" : "bg-[var(--app-text)]"}`} />
                            )}
                            <span>{isExistingColumn ? "Update Name" : "Create Column"}</span>
                        </button>
                    </div>
                </div>
            </form>
        </ModalWrapper>
    );
}
