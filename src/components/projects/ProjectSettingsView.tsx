"use client";

import React, { useState } from "react";
import { Settings, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Columns, ShieldAlert, GripVertical, Lock, Folder, Save, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { useWorkspace } from "../../context/WorkspaceContext";
import ProjectColumnModal from "./ProjectColumnModal";
import { getStageMeta, isSystemColumn } from "../../utils/projectProgress";
import { getProjectPermissions } from "../../utils/projectPermissions";

interface ProjectSettingsViewProps {
    project: any;
    onRefresh?: (silent?: boolean) => void;
}

export default function ProjectSettingsView({ project, onRefresh }: ProjectSettingsViewProps) {
    const { currentUser, userRole, currentTeam } = useWorkspace();
    const permissions = getProjectPermissions(project, currentUser, userRole, currentTeam);
    const isProjectManagerOrLeader = permissions.canManageTasks;

    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState<any | null>(null);

    // Project renaming state
    const [projectName, setProjectName] = useState(project?.name || "");
    const [isRenaming, setIsRenaming] = useState(false);

    React.useEffect(() => {
        if (project?.name) {
            setProjectName(project.name);
        }
    }, [project?.name]);

    // Drag and Drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [localColumns, setLocalColumns] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (project?.columns) {
            setLocalColumns([...project.columns].sort((a: any, b: any) => a.order - b.order));
        }
    }, [project?.columns]);

    const tasks = project?.tasks || [];

    const handleRenameProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectName.trim()) {
            toast.error("Project name cannot be empty.");
            return;
        }
        if (projectName.trim() === project?.name) {
            return;
        }
        try {
            setIsRenaming(true);
            await api.updateProject(project.id, { name: projectName.trim() });
            toast.success("Project name updated successfully.");
            if (onRefresh) onRefresh(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to rename project.");
        } finally {
            setIsRenaming(false);
        }
    };

    const handleCreateOrUpdateColumn = async (name: string, type = "CUSTOM", isComplete = false) => {
        if (editingColumn) {
            await api.updateProjectColumn(project.id, editingColumn.id, {
                name,
                type: editingColumn.type || (isSystemColumn(editingColumn) ? "SYSTEM" : "CUSTOM"),
                isComplete: isComplete !== undefined ? isComplete : editingColumn.isComplete,
            });
            toast.success("Column configuration saved.");
        } else {
            await api.createProjectColumn(project.id, name, type, isComplete);
            toast.success("Column created.");
        }
        if (onRefresh) onRefresh(true);
    };

    const handleDeleteColumn = async (columnId: string, colName: string, isSystem: boolean) => {
        if (isSystem) {
            toast.error("Core system workflow stages cannot be deleted.");
            return;
        }
        if (localColumns.length <= 1) {
            toast.error("Cannot delete the only remaining column.");
            return;
        }
        if (!confirm(`Are you sure you want to delete column "${colName}"? Any tasks inside this column will be moved to another existing column.`)) {
            return;
        }
        try {
            await api.deleteProjectColumn(project.id, columnId);
            toast.success("Column deleted.");
            if (onRefresh) onRefresh(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete column.");
        }
    };

    const handleMoveColumn = async (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= localColumns.length) return;
        reorderAndSave(index, targetIndex);
    };

    // Optimistic, completely silent background reordering
    const reorderAndSave = async (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= localColumns.length || toIndex >= localColumns.length) {
            return;
        }

        const updated = [...localColumns];
        const [movedItem] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, movedItem);

        // Optimistically update UI immediately
        setLocalColumns(updated);

        const columnOrders = updated.map((c: any, idx: number) => ({
            id: c.id,
            order: idx,
        }));

        try {
            // Persist order state silently in database
            await api.reorderProjectColumns(project.id, columnOrders);
            if (onRefresh) onRefresh(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to reorder columns.");
            // Revert to server state on network failure
            if (project?.columns) {
                setLocalColumns([...project.columns].sort((a: any, b: any) => a.order - b.order));
            }
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (!isProjectManagerOrLeader) return;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (!isProjectManagerOrLeader) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        if (!isProjectManagerOrLeader) return;
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== dropIndex) {
            reorderAndSave(draggedIndex, dropIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--app-bg)] flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--app-border)] pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px]">
                        <Settings className="w-5 h-5 text-[var(--app-text)]" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--app-text)]">
                            Project Settings
                        </h2>
                        <p className="text-[11px] text-[var(--app-muted)]">
                            Manage board workflow stages, fine-grained progress mapping, and project configurations
                        </p>
                    </div>
                </div>

                {!isProjectManagerOrLeader && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 text-[var(--color-warning)] text-[10px] rounded-[2px]">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>View-only (Requires Manager or Leader role to edit)</span>
                    </div>
                )}
            </div>

            {/* General Project Settings Section */}
            <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-[var(--app-border)] pb-3">
                    <Folder className="w-4 h-4 text-[var(--app-text)]" />
                    <h3 className="text-xs font-semibold text-[var(--app-text)] uppercase tracking-wider">
                        General Information
                    </h3>
                </div>

                <form onSubmit={handleRenameProject} className="flex flex-col gap-3 max-w-lg">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="projectNameInput" className="text-[11px] font-medium text-[var(--app-text)]">
                            Project Name
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="projectNameInput"
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                disabled={!isProjectManagerOrLeader || isRenaming}
                                placeholder="Enter project name..."
                                className="flex-1 px-3 py-1.5 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none focus:border-[var(--app-border-strong)] disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            {isProjectManagerOrLeader && (
                                <button
                                    type="submit"
                                    disabled={isRenaming || !projectName.trim() || projectName.trim() === project?.name}
                                    className="relative corner-brackets-4 px-3.5 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] font-semibold text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                    {isRenaming ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[var(--app-text)]" />
                                    ) : (
                                        <Save className="w-3.5 h-3.5" />
                                    )}
                                    <span>Save Name</span>
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Main Columns Configuration Section */}
            <div className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[3px] p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Columns className="w-4 h-4 text-[var(--app-text)]" />
                        <h3 className="text-xs font-semibold text-[var(--app-text)] uppercase tracking-wider">
                            Board Workflow Stages & Columns
                        </h3>
                        <span className="text-[10px] text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] tabular-nums">
                            {localColumns.length} stages
                        </span>
                    </div>

                    {isProjectManagerOrLeader && (
                        <button
                            onClick={() => {
                                setEditingColumn(null);
                                setIsColumnModalOpen(true);
                            }}
                            className="relative corner-brackets-4 flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-medium bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] rounded-[2px] transition-colors cursor-pointer shadow-2xs"
                        >
                            <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                            <span>Add Custom Stage</span>
                        </button>
                    )}
                </div>

                <p className="text-[11px] text-[var(--app-muted)] leading-normal">
                    Reorder and customize your Jira-style 4-stage workflow columns. Drag any column using the handle to reorder — changes save silently in the background. System stages are protected to maintain accurate 0% → 25% → 75% → 100% progress metrics.
                </p>

                {/* Column Table / List */}
                <div className="border border-[var(--app-border)] rounded-[2px] overflow-hidden bg-[var(--app-bg)]">
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[var(--app-border)] text-[10px] font-semibold text-[var(--app-muted)] uppercase tracking-wider bg-[var(--app-card)]">
                        <div className="col-span-1">Order</div>
                        <div className="col-span-5">Column Name</div>
                        <div className="col-span-3">Progress Stage</div>
                        <div className="col-span-1">Tasks</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    <div className="divide-y divide-[var(--app-border)]">
                        {localColumns.map((col: any, index: number) => {
                            const taskCount = tasks.filter((t: any) => t.columnId === col.id).length;
                            const isBeingDragged = draggedIndex === index;
                            const isBeingOvered = dragOverIndex === index && draggedIndex !== index;
                            const isSystem = isSystemColumn(col);
                            const stageMeta = getStageMeta(col);

                            return (
                                <div
                                    key={col.id}
                                    draggable={isProjectManagerOrLeader}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs text-[var(--app-text)] transition-all ${
                                        isBeingDragged ? "opacity-30 bg-[var(--app-card)]" : "hover:bg-[var(--app-hover-bg)]"
                                    } ${
                                        isBeingOvered ? "border-t-2 border-dashed border-[var(--app-text)] bg-[var(--app-card)]" : ""
                                    }`}
                                >
                                    {/* Order & Drag handle controls */}
                                    <div className="col-span-1 flex items-center gap-1.5">
                                        {isProjectManagerOrLeader && (
                                            <span title="Drag to reorder silently">
                                                <GripVertical className="w-3.5 h-3.5 text-[var(--app-muted)] hover:text-[var(--app-text)] cursor-grab active:cursor-grabbing shrink-0" />
                                            </span>
                                        )}
                                        <span className="font-semibold text-[var(--app-muted)] text-[11px]">
                                            #{index + 1}
                                        </span>
                                        {isProjectManagerOrLeader && (
                                            <div className="flex flex-col gap-0.5 ml-1">
                                                <button
                                                    onClick={() => handleMoveColumn(index, "up")}
                                                    disabled={index === 0}
                                                    className="text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:opacity-30 p-0.5 cursor-pointer"
                                                    title="Move Up"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveColumn(index, "down")}
                                                    disabled={index === localColumns.length - 1}
                                                    className="text-[var(--app-muted)] hover:text-[var(--app-text)] disabled:opacity-30 p-0.5 cursor-pointer"
                                                    title="Move Down"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="col-span-5 font-medium flex items-center gap-2">
                                        <span>{col.name}</span>
                                        {isSystem && (
                                            <span className="text-[9px] text-[var(--app-muted)] bg-[var(--app-card)] border border-[var(--app-border)] px-1.5 py-0.2 rounded-[2px] flex items-center gap-1 shrink-0" title="Core System Stage">
                                                <Shield className="w-2.5 h-2.5 text-[var(--app-muted)]" />
                                                <span>System</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Stage Badge */}
                                    <div className="col-span-3">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[10px]">
                                            <span className="font-semibold text-[var(--app-text)]">{stageMeta.label}</span>
                                            <span className="text-[9px] text-[var(--app-muted)] tabular-nums">({stageMeta.weight}%)</span>
                                        </div>
                                    </div>

                                    {/* Task Count */}
                                    <div className="col-span-1 text-[11px] text-[var(--app-muted)]">
                                        <span className="px-1.5 py-0.5 bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] text-[10px] font-medium tabular-nums">
                                            {taskCount}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                                        {isProjectManagerOrLeader ? (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingColumn(col);
                                                        setIsColumnModalOpen(true);
                                                    }}
                                                    className="p-1 text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-card)] rounded transition-colors cursor-pointer"
                                                    title={`Edit column ${col.name}`}
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                {isSystem ? (
                                                    <span
                                                        className="p-1 text-[var(--app-muted)] opacity-40 cursor-not-allowed"
                                                        title="System workflow stages are protected from deletion"
                                                    >
                                                        <Lock className="w-3.5 h-3.5" />
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeleteColumn(col.id, col.name, isSystem)}
                                                        disabled={localColumns.length <= 1}
                                                        className="p-1 text-[var(--app-muted)] hover:text-[var(--color-error)] hover:bg-[var(--app-card)] rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={localColumns.length <= 1 ? "Cannot delete only remaining column" : `Delete column ${col.name}`}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-[10px] text-[var(--app-muted)] italic">Locked</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Column Modal */}
            <ProjectColumnModal
                isOpen={isColumnModalOpen}
                onClose={() => setIsColumnModalOpen(false)}
                onSave={handleCreateOrUpdateColumn}
                onDelete={(col) => handleDeleteColumn(col.id, col.name, isSystemColumn(col))}
                initialData={editingColumn}
            />
        </div>
    );
}
