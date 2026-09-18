"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    X,
    Scale,
    SlidersHorizontal,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    Layers,
    Info,
    GripVertical,
    ArrowUp,
    ArrowDown,
    TrendingUp,
    Plus,
    Trash2,
    Check,
    Edit2,
    Loader2,
} from "lucide-react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import SideSheetWrapper from "../ui/SideSheetWrapper";
import { Button } from "../ui/Button";
import { getStageWeight, isSystemColumn } from "../../utils/projectProgress";

export interface ColumnMilestoneItem {
    id: string;
    name: string;
    milestone: number; // Target completion milestone (0 to 100%)
    isWeightless: boolean;
    isComplete?: boolean;
    type?: string;
    order: number;
    rawColumn?: any;
}

interface ProjectColumnWeightManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    columns: any[];
    onSaveWeights: (
        updatedWeights: { id: string; weight: number | null }[],
        updatedOrders?: { id: string; order: number }[]
    ) => Promise<void>;
    onCreateColumn?: (name: string, weight?: number | null) => Promise<void>;
    onDeleteColumn?: (column: any) => Promise<void>;
    onRenameColumn?: (columnId: string, name: string) => Promise<void>;
}

const PRESET_MILESTONES = [0, 25, 50, 75, 100];

export default function ProjectColumnWeightManagerModal({
    isOpen,
    onClose,
    columns,
    onSaveWeights,
    onCreateColumn,
    onDeleteColumn,
    onRenameColumn,
}: ProjectColumnWeightManagerModalProps) {
    const [milestoneItems, setMilestoneItems] = useState<ColumnMilestoneItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inline Add Column state
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColName, setNewColName] = useState("");
    const [newColMilestone, setNewColMilestone] = useState<number>(100);
    const [isCreatingCol, setIsCreatingCol] = useState(false);

    // Inline rename state
    const [editingColId, setEditingColId] = useState<string | null>(null);
    const [editingColName, setEditingColName] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);

    // Initialize items when modal opens or columns change
    useEffect(() => {
        if (isOpen && Array.isArray(columns)) {
            const sorted = [...columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const hasExplicitWeights = sorted.some((c) => c.weight !== undefined && c.weight !== null);

            let runningCumulative = 0;
            const items: ColumnMilestoneItem[] = sorted.map((col, idx) => {
                const currentWeight = getStageWeight(col);
                const hasExplicitWeight = col.weight !== undefined && col.weight !== null;
                const isWeightless = hasExplicitWeight
                    ? col.weight === 0
                    : (col.type === "CUSTOM" || col.type === "UNWEIGHTED") && !col.isComplete;

                let targetMilestone = 0;
                if (hasExplicitWeights) {
                    const step = hasExplicitWeight ? Math.max(0, Math.min(100, Number(col.weight))) : 0;
                    runningCumulative = Math.min(100, runningCumulative + step);
                    targetMilestone = col.isComplete ? 100 : (isWeightless ? runningCumulative - step : runningCumulative);
                } else {
                    targetMilestone = col.isComplete ? 100 : currentWeight;
                }

                return {
                    id: col.id,
                    name: col.name,
                    milestone: isWeightless ? 0 : Math.max(0, Math.min(100, targetMilestone)),
                    isWeightless,
                    isComplete: Boolean(col.isComplete),
                    type: col.type,
                    order: idx,
                    rawColumn: col,
                };
            });
            setMilestoneItems(items);
            setIsAddingColumn(false);
            setNewColName("");
            setEditingColId(null);
        }
    }, [isOpen, columns]);

    // Calculate step deltas behind the scenes from the user's milestone inputs
    const stepDeltas = useMemo(() => {
        const deltas: Record<string, number> = {};
        let prevMilestone = 0;

        milestoneItems.forEach((item) => {
            if (item.isWeightless) {
                deltas[item.id] = 0;
            } else {
                const step = Math.max(0, item.milestone - prevMilestone);
                deltas[item.id] = step;
                prevMilestone = item.milestone;
            }
        });
        return deltas;
    }, [milestoneItems]);

    // Maximum milestone reached across all columns
    const maxMilestone = useMemo(() => {
        const active = milestoneItems.filter((it) => !it.isWeightless);
        if (active.length === 0) return 0;
        return Math.max(...active.map((it) => it.milestone));
    }, [milestoneItems]);

    const remainingToFull = Math.max(0, 100 - maxMilestone);
    const isExceeded = maxMilestone > 100 || milestoneItems.some((it) => it.milestone > 100);
    const isFullyCompleted = maxMilestone === 100;

    // Check if stages are non-decreasing
    const hasDecreasingStages = useMemo(() => {
        let prev = 0;
        for (const item of milestoneItems) {
            if (!item.isWeightless) {
                if (item.milestone < prev) return true;
                prev = item.milestone;
            }
        }
        return false;
    }, [milestoneItems]);

    // Handle user changing milestone percentage for a column directly
    const handleSetMilestone = (id: string, targetMilestone: number) => {
        const clamped = Math.max(0, Math.min(100, Math.round(targetMilestone)));
        setMilestoneItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    milestone: clamped,
                    isWeightless: clamped === 0,
                };
            })
        );
    };

    // Toggle weightless for a column
    const handleToggleWeightless = (id: string) => {
        setMilestoneItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const nextWeightless = !item.isWeightless;
                return {
                    ...item,
                    isWeightless: nextWeightless,
                    milestone: nextWeightless ? 0 : 50,
                };
            })
        );
    };

    // Move column up/down in sequence
    const handleMoveColumn = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= milestoneItems.length) return;

        const updated = Array.from(milestoneItems);
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);

        setMilestoneItems(updated.map((it, idx) => ({ ...it, order: idx })));
    };

    // Handle Drag & Drop reordering inside modal
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;

        const updated = Array.from(milestoneItems);
        const [moved] = updated.splice(result.source.index, 1);
        updated.splice(result.destination.index, 0, moved);

        setMilestoneItems(updated.map((it, idx) => ({ ...it, order: idx })));
    };

    // Auto distribute / balance stages evenly to reach 100%
    const handleAutoDistributeStages = () => {
        const nonWeightless = milestoneItems.filter((it) => !it.isWeightless);
        if (nonWeightless.length <= 1) {
            toast.error("Need at least two active stages to balance milestones.");
            return;
        }

        const count = nonWeightless.length;
        const step = Math.round(100 / Math.max(1, count - 1));

        let activeIdx = 0;
        setMilestoneItems((prev) =>
            prev.map((item) => {
                if (item.isWeightless) return item;
                const m = activeIdx === count - 1 ? 100 : Math.min(100, activeIdx * step);
                activeIdx++;
                return {
                    ...item,
                    milestone: m,
                };
            })
        );
        toast.success("Evenly distributed stage milestones across all columns.");
    };

    // Reset to standard 4-stage progression (0%, 25%, 75%, 100%)
    const handleResetStandard = () => {
        if (milestoneItems.length === 0) return;

        if (milestoneItems.length === 4) {
            setMilestoneItems((prev) =>
                prev.map((item, idx) => {
                    if (idx === 0) return { ...item, milestone: 0, isWeightless: false };
                    if (idx === 1) return { ...item, milestone: 25, isWeightless: false };
                    if (idx === 2) return { ...item, milestone: 75, isWeightless: false };
                    return { ...item, milestone: 100, isWeightless: false };
                })
            );
            toast.success("Reset to standard progression (0% → 25% → 75% → 100%)");
            return;
        }

        handleAutoDistributeStages();
    };

    // Handle Create Column within modal
    const handleCreateNewColumn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newColName.trim()) {
            toast.error("Please enter a column title.");
            return;
        }

        if (!onCreateColumn) return;

        try {
            setIsCreatingCol(true);
            // Calculate step delta for the new column behind the scenes
            const delta = Math.max(0, Math.min(100, newColMilestone - maxMilestone));
            await onCreateColumn(newColName.trim(), delta);
            setNewColName("");
            setNewColMilestone(100);
            setIsAddingColumn(false);
            toast.success("Column added successfully.");
        } catch (err: any) {
            toast.error(err.message || "Failed to add column");
        } finally {
            setIsCreatingCol(false);
        }
    };

    // Handle Rename Column
    const handleSaveRename = async (colId: string) => {
        if (!editingColName.trim()) {
            toast.error("Column title cannot be empty.");
            return;
        }
        if (!onRenameColumn) return;

        try {
            setIsRenaming(true);
            await onRenameColumn(colId, editingColName.trim());
            setMilestoneItems((prev) =>
                prev.map((it) => (it.id === colId ? { ...it, name: editingColName.trim() } : it))
            );
            setEditingColId(null);
            toast.success("Column renamed");
        } catch (err: any) {
            toast.error(err.message || "Failed to rename column");
        } finally {
            setIsRenaming(false);
        }
    };

    // Save handler: calculates step deltas behind the scenes and saves to backend
    const handleSave = async () => {
        if (isExceeded) {
            toast.error("Stage milestone cannot exceed 100%.");
            return;
        }

        try {
            setIsSubmitting(true);
            // Behind the scenes difference calculation
            let prevMilestone = 0;
            const weightsPayload = milestoneItems.map((item) => {
                if (item.isWeightless) {
                    return { id: item.id, weight: 0 };
                }
                const stepDelta = Math.max(0, item.milestone - prevMilestone);
                prevMilestone = item.milestone;
                return {
                    id: item.id,
                    weight: stepDelta,
                };
            });

            const ordersPayload = milestoneItems.map((item, idx) => ({
                id: item.id,
                order: idx,
            }));

            await onSaveWeights(weightsPayload, ordersPayload);
            toast.success("Workflow stage progression updated successfully.");
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update workflow progression.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SideSheetWrapper isOpen={isOpen} onClose={onClose} width="xl">
            <div className="h-full flex flex-col bg-[var(--app-card)] text-[var(--app-text)]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--app-border)] bg-[var(--app-card)] select-none shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[3px] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] shrink-0">
                            <Scale className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--app-text)] tracking-tight">
                                Workflow Stage Progress &amp; Sequence
                            </h3>
                            <p className="text-[11px] text-[var(--app-muted)]">
                                Configure the workflow stages, sequence order, and progress milestones for this project
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors p-1.5 rounded-[2px] cursor-pointer hover:bg-[var(--app-hover-bg)]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {/* 1. Workflow Progression Summary Bar */}
                <div className="p-4 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] flex flex-col gap-3">
                    {/* Header Row: Stats & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--app-text)]">
                                <Layers className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Workflow Completion:</span>
                            </div>
                            <span
                                className={`px-2 py-0.5 rounded-[2px] font-bold text-[11px] tabular-nums ${
                                    isExceeded
                                        ? "bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30"
                                        : isFullyCompleted
                                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30"
                                        : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/30"
                                }`}
                            >
                                {maxMilestone}% / 100%
                            </span>

                            <div className="text-[11px] flex items-center gap-1 ml-1">
                                {isExceeded ? (
                                    <span className="text-[var(--color-error)] font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Exceeds 100%
                                    </span>
                                ) : isFullyCompleted ? (
                                    <span className="text-[var(--color-success)] font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Complete 100% Flow
                                    </span>
                                ) : (
                                    <span className="text-[var(--app-muted)] font-medium">
                                        ({remainingToFull}% remaining)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Automation Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleAutoDistributeStages}
                                className="h-[28px] px-2.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--color-accent)] text-[var(--app-text)] hover:text-[var(--color-accent)] rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-3xs"
                                title="Evenly distribute stage percentages across all columns"
                            >
                                <SlidersHorizontal className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                                <span>Distribute Evenly</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResetStandard}
                                className="h-[28px] px-2.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-3xs"
                                title="Reset to standard 4-stage progression (0%, 25%, 75%, 100%)"
                            >
                                <RotateCcw className="w-3 h-3 shrink-0" />
                                <span>Reset Defaults</span>
                            </button>
                        </div>
                    </div>

                    {/* Multi-segment Progress Bar Visualization */}
                    <div className="w-full h-3 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] overflow-hidden flex shadow-inner">
                        {milestoneItems.map((item, idx) => {
                            const step = stepDeltas[item.id] || 0;
                            if (item.isWeightless || step <= 0) return null;
                            const colors = [
                                "bg-sky-500",
                                "bg-indigo-500",
                                "bg-amber-500",
                                "bg-emerald-500",
                                "bg-purple-500",
                                "bg-teal-500",
                            ];
                            const segmentColor = colors[idx % colors.length];

                            return (
                                <div
                                    key={item.id}
                                    style={{ width: `${Math.min(100, step)}%` }}
                                    className={`${segmentColor} h-full transition-all duration-300 relative group flex items-center justify-center text-[9px] font-bold text-white overflow-hidden`}
                                    title={`${item.name}: Reaches ${item.milestone}% (+${step}% step)`}
                                >
                                    {step >= 12 && `${item.milestone}%`}
                                </div>
                            );
                        })}
                    </div>

                    {/* Helper Note */}
                    <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--app-muted)]">
                        <Info className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                        <span>
                            Select the target milestone for each column. Differences from previous stages are calculated automatically.
                        </span>
                    </div>
                </div>

                {/* Non-sequential Warning if any */}
                {hasDecreasingStages && (
                    <div className="px-3 py-2 bg-[var(--color-warning)]/10 border-l-2 border-[var(--color-warning)] rounded-r-[2px] text-[11.5px] text-[var(--app-text)] flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-[var(--color-warning)] shrink-0" />
                        <span>
                            Some columns have lower milestone percentages than previous stages. You can drag to reorder them into a logical sequence.
                        </span>
                    </div>
                )}

                {/* 2. Reorderable List of Columns */}
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between select-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                            Workflow Stages Sequence ({milestoneItems.length})
                        </span>
                        {onCreateColumn && !isAddingColumn && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingColumn(true);
                                    setNewColMilestone(100);
                                }}
                                className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add New Column</span>
                            </button>
                        )}
                    </div>

                    {/* Inline Add Column Form */}
                    {isAddingColumn && (
                        <form
                            onSubmit={handleCreateNewColumn}
                            className="p-3.5 rounded-[3px] bg-[var(--app-card)] border-2 border-[var(--color-accent)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[var(--color-accent)] text-white rounded-[2px] shrink-0">
                                    NEW
                                </span>
                                <input
                                    type="text"
                                    value={newColName}
                                    onChange={(e) => setNewColName(e.target.value)}
                                    placeholder="Enter new column name (e.g. QA Review)..."
                                    autoFocus
                                    disabled={isCreatingCol}
                                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-border-strong)]"
                                />
                            </div>

                            <div className="flex items-center gap-2 shrink-0 justify-end">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-[var(--app-muted)] font-medium">Reaches:</span>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={newColMilestone}
                                            onChange={(e) => setNewColMilestone(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                                            className="w-14 h-[28px] bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] px-2 pr-4 text-right text-xs font-mono font-bold text-[var(--app-text)] focus:outline-none"
                                        />
                                        <span className="absolute right-1 text-[10px] font-mono text-[var(--app-muted)] pointer-events-none">%</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setIsAddingColumn(false);
                                        setNewColName("");
                                    }}
                                    disabled={isCreatingCol}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={isCreatingCol || !newColName.trim()}
                                    isLoading={isCreatingCol}
                                    loadingText="Adding..."
                                >
                                    Add Column
                                </Button>
                            </div>
                        </form>
                    )}

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="column-milestone-list">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex flex-col gap-2"
                                >
                                    {milestoneItems.map((item, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === milestoneItems.length - 1;
                                        const isCore = isSystemColumn(item.rawColumn);
                                        const isEditingThis = editingColId === item.id;
                                        const step = stepDeltas[item.id] || 0;

                                        return (
                                            <Draggable key={item.id} draggableId={item.id} index={idx}>
                                                {(dragProvided, snapshot) => (
                                                    <div
                                                        ref={dragProvided.innerRef}
                                                        {...dragProvided.draggableProps}
                                                        className={`p-3 rounded-[3px] border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                            snapshot.isDragging
                                                                ? "bg-[var(--app-card)] shadow-xl ring-1 ring-[var(--app-border-strong)] z-50"
                                                                : item.isWeightless
                                                                ? "bg-[var(--app-bg)]/60 border-dashed border-[var(--app-border)] opacity-80"
                                                                : "bg-[var(--app-bg)] border-[var(--app-border)]"
                                                        }`}
                                                    >
                                                        {/* Left: Drag Handle, Reorder Buttons & Column Identity */}
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            {/* Drag handle */}
                                                            <div
                                                                {...dragProvided.dragHandleProps}
                                                                className="cursor-grab active:cursor-grabbing p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] shrink-0"
                                                                title="Drag to reorder stage"
                                                            >
                                                                <GripVertical className="w-3.5 h-3.5" />
                                                            </div>

                                                            {/* Step Order & Move buttons */}
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveColumn(idx, "up")}
                                                                    disabled={isFirst}
                                                                    className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                                                    title="Move stage up"
                                                                >
                                                                    <ArrowUp className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMoveColumn(idx, "down")}
                                                                    disabled={isLast}
                                                                    className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                                                    title="Move stage down"
                                                                >
                                                                    <ArrowDown className="w-3 h-3" />
                                                                </button>
                                                            </div>

                                                            {/* Column Name & Milestone Target Badge */}
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    {isEditingThis ? (
                                                                        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                                                                            <input
                                                                                type="text"
                                                                                value={editingColName}
                                                                                onChange={(e) => setEditingColName(e.target.value)}
                                                                                autoFocus
                                                                                disabled={isRenaming}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter") handleSaveRename(item.id);
                                                                                    if (e.key === "Escape") setEditingColId(null);
                                                                                }}
                                                                                className="px-2 py-0.5 text-xs bg-[var(--app-card)] border border-[var(--app-border-strong)] rounded-[2px] text-[var(--app-text)] w-full"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleSaveRename(item.id)}
                                                                                disabled={isRenaming}
                                                                                className="p-1 text-[var(--color-success)] hover:bg-[var(--app-hover-bg)] rounded-[2px] cursor-pointer"
                                                                            >
                                                                                {isRenaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setEditingColId(null)}
                                                                                disabled={isRenaming}
                                                                                className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px] cursor-pointer"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5 group/name">
                                                                            <span className="text-xs font-semibold text-[var(--app-text)] truncate">
                                                                                {item.name}
                                                                            </span>
                                                                            {onRenameColumn && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setEditingColId(item.id);
                                                                                        setEditingColName(item.name);
                                                                                    }}
                                                                                    className="opacity-0 group-hover/name:opacity-100 p-0.5 text-[var(--app-muted)] hover:text-[var(--app-text)] transition-opacity cursor-pointer"
                                                                                    title="Rename column"
                                                                                >
                                                                                    <Edit2 className="w-2.5 h-2.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Milestone Progress Badge */}
                                                                    <span
                                                                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-[2px] border flex items-center gap-1 tabular-nums ${
                                                                            item.milestone === 100
                                                                                ? "bg-[var(--status-completed,#15803D)]/10 text-[var(--status-completed,#15803D)] border-[var(--status-completed,#15803D)]/30"
                                                                                : item.milestone >= 50
                                                                                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30"
                                                                                : "bg-[var(--app-card)] text-[var(--app-text)] border-[var(--app-border)]"
                                                                        }`}
                                                                        title={`Tasks in this column reach ${item.milestone}% completion`}
                                                                    >
                                                                        <TrendingUp className="w-2.5 h-2.5" />
                                                                        <span>{item.milestone}%</span>
                                                                    </span>
                                                                </div>

                                                                <span className="text-[10px] text-[var(--app-muted)]">
                                                                    {item.isWeightless
                                                                        ? "Weightless stage (0% progress contribution)"
                                                                        : `Progress milestone: ${item.milestone}% (${step > 0 ? `+${step}% diff from previous` : "starting point"})`}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Right: Milestone Presets & Direct Input */}
                                                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                                            {/* Preset Chips */}
                                                            <div className="flex items-center gap-1 bg-[var(--app-card)] p-1 border border-[var(--app-border)] rounded-[2px]">
                                                                {PRESET_MILESTONES.map((preset) => {
                                                                    const isActive = !item.isWeightless && item.milestone === preset;
                                                                    const isZeroActive = item.isWeightless && preset === 0;
                                                                    const selected = isActive || isZeroActive;

                                                                    return (
                                                                        <button
                                                                            key={preset}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (preset === 0) {
                                                                                    handleToggleWeightless(item.id);
                                                                                } else {
                                                                                    handleSetMilestone(item.id, preset);
                                                                                }
                                                                            }}
                                                                            className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] transition-all cursor-pointer ${
                                                                                selected
                                                                                    ? "bg-[var(--color-accent)] text-white shadow-xs"
                                                                                    : "text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)]"
                                                                            }`}
                                                                        >
                                                                            {preset}%
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Exact Milestone Number Input */}
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={100}
                                                                    step={1}
                                                                    value={item.isWeightless ? 0 : item.milestone}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        handleSetMilestone(item.id, isNaN(val) ? 0 : val);
                                                                    }}
                                                                    className="w-16 h-[28px] bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] focus:border-[var(--app-border-strong)] rounded-[2px] px-2 text-right text-xs font-mono font-bold text-[var(--app-text)] focus:outline-none pr-5"
                                                                />
                                                                <span className="absolute right-1.5 text-[10px] font-mono text-[var(--app-muted)] pointer-events-none">
                                                                    %
                                                                </span>
                                                            </div>

                                                            {/* Delete Column button for custom columns */}
                                                            {!isCore && onDeleteColumn && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => onDeleteColumn(item.rawColumn)}
                                                                    className="p-1.5 text-[var(--app-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-[2px] transition-colors cursor-pointer"
                                                                    title="Delete column"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--app-border)] bg-[var(--app-card)] shrink-0 select-none">
                    <div className="text-[11px] text-[var(--app-muted)]">
                        {isExceeded && (
                            <span className="text-[var(--color-error)] font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Stage milestone cannot exceed 100%.
                            </span>
                        )}
                    </div>

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
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleSave}
                            disabled={isSubmitting || isExceeded}
                            isLoading={isSubmitting}
                            loadingText="Saving..."
                        >
                            Save Stage Progression
                        </Button>
                    </div>
                </div>
            </div>
        </SideSheetWrapper>
    );
}
