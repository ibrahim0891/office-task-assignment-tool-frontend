"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Users, Calendar, Clock, Loader2, Trash2, X, AlertTriangle, Check, Layers } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { CustomSelect } from "../ui/CustomSelect";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { TipTapEditor } from "../ui/TipTapEditor";
import SideSheetWrapper from "../ui/SideSheetWrapper";
import { Button } from "../ui/Button";
import { UserAvatar } from "../ui/UserAvatar";
import { calculateDaySpan, formatDaySpan } from "../../utils/date";

interface UpdateProjectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    task: any;
    onRefresh?: (silent?: boolean) => void;
    onTaskDeleted?: () => void;
}

const formatDateInput = (dateInput: any) => {
    if (!dateInput) return "";
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
    } catch {
        return "";
    }
};

export default function UpdateProjectTaskModal({
    isOpen,
    onClose,
    project,
    task,
    onRefresh,
    onTaskDeleted,
}: UpdateProjectTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [columnId, setColumnId] = useState("");
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [priority, setPriority] = useState("MEDIUM");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const columns = (project?.columns || []).slice().sort((a: any, b: any) => a.order - b.order);

    const projMinDate = project?.startDate ? formatDateInput(project.startDate) : "";
    const projMaxDate = project?.endDate ? formatDateInput(project.endDate) : "";

    const availableMembers: any[] = [];
    const seenIds = new Set<string>();

    if (project?.manager) {
        seenIds.add(project.manager.id);
        availableMembers.push({
            id: project.manager.id,
            name: project.manager.name,
            email: project.manager.email,
            avatarUrl: project.manager.avatarUrl || null,
            role: "Manager",
        });
    }

    if (project?.members) {
        project.members.forEach((m: any) => {
            if (m.user && !seenIds.has(m.userId)) {
                seenIds.add(m.userId);
                availableMembers.push({
                    id: m.userId,
                    name: m.user.name,
                    email: m.user.email,
                    avatarUrl: m.user.avatarUrl || null,
                    role: m.role || "Member",
                });
            }
        });
    }

    useEffect(() => {
        if (task && isOpen) {
            setTitle(task.title || "");
            setDescription(task.description || "");
            setColumnId(task.columnId || (columns[0]?.id || ""));
            setPriority(task.priority || "MEDIUM");
            setStartDate(formatDateInput(task.startDate));
            setDueDate(formatDateInput(task.dueDate));
            setShowDeleteConfirm(false);

            if (Array.isArray(task.assignees)) {
                const ids = task.assignees.map((a: any) => a.userId || a.user?.id || a.id).filter(Boolean);
                setSelectedAssigneeIds(ids);
            } else {
                setSelectedAssigneeIds([]);
            }
        }
    }, [task, isOpen]);

    if (!isOpen || !task) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Task title is required");
            return;
        }

        const targetColId = columnId || columns[0]?.id;
        if (!targetColId) {
            toast.error("No columns available in this project");
            return;
        }

        if (projMinDate && startDate && startDate < projMinDate) {
            toast.error(`Start date cannot be earlier than project start (${projMinDate})`);
            return;
        }
        if (projMaxDate && startDate && startDate > projMaxDate) {
            toast.error(`Start date cannot be later than project end (${projMaxDate})`);
            return;
        }
        if (projMinDate && dueDate && dueDate < projMinDate) {
            toast.error(`Due date cannot be earlier than project start (${projMinDate})`);
            return;
        }
        if (projMaxDate && dueDate && dueDate > projMaxDate) {
            toast.error(`Due date cannot be later than project end (${projMaxDate})`);
            return;
        }
        if (startDate && dueDate && startDate > dueDate) {
            toast.error("Start date cannot be later than due date");
            return;
        }

        try {
            setLoading(true);
            const calculatedEstimatedDays = calculateDaySpan(startDate, dueDate);
            await api.updateProjectTask(project.id, task.id, {
                title: title.trim(),
                description: description.trim(),
                columnId: targetColId,
                assigneeIds: selectedAssigneeIds,
                startDate: startDate || null,
                dueDate: dueDate || null,
                priority,
                estimatedDays: calculatedEstimatedDays,
            });

            toast.success("Main task updated successfully.");
            onClose();
            if (onRefresh) onRefresh(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async () => {
        try {
            setIsDeleting(true);
            await api.deleteProjectTask(project.id, task.id);
            toast.success("Main task deleted.");
            onClose();
            if (onTaskDeleted) {
                onTaskDeleted();
            } else if (onRefresh) {
                onRefresh(true);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to delete task");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <SideSheetWrapper
            isOpen={isOpen}
            onClose={onClose}
            width="lg"
            className="flex flex-col h-full bg-[var(--app-card)] border-l border-[var(--app-border)] text-left select-none text-[var(--app-text)]"
        >
            {/* ── Top Header ── */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                        <h2 className="font-heading text-base font-bold text-[var(--app-text)] tracking-tight">
                            Edit Main Task
                        </h2>
                    </div>
                    <p className="text-[11px] text-[var(--app-muted)] leading-tight">
                        Modify task details, assignees, dates, and workflow stage.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] w-7 h-7 rounded-[3px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Close Drawer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Delete Confirmation Alert Banner */}
            {showDeleteConfirm && (
                <div className="mx-6 mt-4 p-3.5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-[3px] flex flex-col gap-2 animate-fade-in text-[var(--color-error)]">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold">Delete this Main Task?</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[var(--app-text)]">
                        This will permanently delete "{task.title}" and all its subtasks, comments, and attachments. This action cannot be undone.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleDeleteTask}
                            isLoading={isDeleting}
                            loadingText="Deleting..."
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Scrollable Form Body ── */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 custom-scrollbar select-text">
                {/* Task Title */}
                <div className="flex flex-col gap-1.5">
                    <label className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                        Task Title <span className="text-[var(--color-error)]">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title..."
                        required
                        className="w-full px-3.5 py-2 text-xs bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[3px] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 transition-all placeholder:text-[var(--app-muted)]"
                    />
                </div>

                {/* Column Selection */}
                {columns.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <label className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            <span>Workflow Stage / Column</span>
                        </label>
                        <CustomSelect
                            options={columns.map((col: any) => ({
                                value: col.id,
                                label: col.name,
                            }))}
                            value={columnId}
                            onChange={(val) => setColumnId(val)}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Priority selection */}
                <div className="flex flex-col gap-1.5">
                    <label className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                        Priority Level
                    </label>
                    <CustomSelect
                        options={[
                            { value: "LOW", label: "Low Priority" },
                            { value: "MEDIUM", label: "Medium Priority" },
                            { value: "HIGH", label: "High Priority" },
                            { value: "URGENT", label: "Urgent Priority" },
                        ]}
                        value={priority}
                        onChange={(val) => setPriority(val)}
                        className="w-full"
                    />
                </div>

                {/* Description - TipTap Editor */}
                <div className="flex flex-col gap-1.5">
                    <label className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold">
                        Description & Scope
                    </label>
                    <TipTapEditor
                        value={description}
                        onChange={(html) => setDescription(html)}
                    />
                </div>

                {/* Start Date & Due Date Grid */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            <span>Schedule & Timeline</span>
                        </label>
                        {startDate && dueDate && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--app-text)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] tabular-nums">
                                <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                                <span>Span: {formatDaySpan(calculateDaySpan(startDate, dueDate))}</span>
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-[var(--app-muted)] font-medium">Start Date</span>
                            <CustomDatePicker
                                value={startDate}
                                minDate={projMinDate || undefined}
                                maxDate={dueDate && projMaxDate ? (dueDate < projMaxDate ? dueDate : projMaxDate) : (dueDate || projMaxDate || undefined)}
                                align="left"
                                onChange={(val) => {
                                    if (projMinDate && val < projMinDate) {
                                        toast.error(`Start date cannot be earlier than project start (${projMinDate})`);
                                        return;
                                    }
                                    if (projMaxDate && val > projMaxDate) {
                                        toast.error(`Start date cannot be later than project end (${projMaxDate})`);
                                        return;
                                    }
                                    setStartDate(val);
                                    if (dueDate && val > dueDate) {
                                        setDueDate(val);
                                    }
                                }}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-[var(--app-muted)] font-medium">Due Date</span>
                            <CustomDatePicker
                                value={dueDate}
                                minDate={startDate && projMinDate ? (startDate > projMinDate ? startDate : projMinDate) : (startDate || projMinDate || undefined)}
                                maxDate={projMaxDate || undefined}
                                align="right"
                                onChange={(val) => {
                                    if (projMinDate && val < projMinDate) {
                                        toast.error(`Due date cannot be earlier than project start (${projMinDate})`);
                                        return;
                                    }
                                    if (projMaxDate && val > projMaxDate) {
                                        toast.error(`Due date cannot be later than project end (${projMaxDate})`);
                                        return;
                                    }
                                    setDueDate(val);
                                    if (startDate && val < startDate) {
                                        setStartDate(val);
                                    }
                                }}
                                className="w-full"
                            />
                        </div>
                    </div>
                    {(projMinDate || projMaxDate) && (
                        <span className="text-[10px] text-[var(--app-muted)] italic">
                            Project boundary: {projMinDate || "Start"} to {projMaxDate || "End"}
                        </span>
                    )}
                </div>

                {/* Member Multi-Select Dropdown & Selected Chips */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="eyebrow text-[10px] tracking-wider text-[var(--app-text)] font-bold flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                            <span>Assign Squad Members</span>
                        </label>
                        <span className="text-[11px] text-[var(--app-muted)] font-medium tabular-nums">
                            {selectedAssigneeIds.length} assigned
                        </span>
                    </div>

                    {availableMembers.filter((m) => !selectedAssigneeIds.includes(m.id)).length > 0 ? (
                        <CustomSelect
                            options={[
                                { value: "", label: "Select member to assign..." },
                                ...availableMembers
                                    .filter((m) => !selectedAssigneeIds.includes(m.id))
                                    .map((m) => ({
                                        value: m.id,
                                        label: `${m.name} (${m.role})`,
                                        avatarUrl: m.avatarUrl || null,
                                    })),
                            ]}
                            value=""
                            onChange={(val) => {
                                if (val && !selectedAssigneeIds.includes(val)) {
                                    setSelectedAssigneeIds((prev) => [...prev, val]);
                                }
                            }}
                            className="w-full"
                        />
                    ) : (
                        <div className="text-xs text-[var(--app-muted)] italic p-3 border border-dashed border-[var(--app-border)] rounded-[3px] text-center">
                            All project members assigned
                        </div>
                    )}

                    {/* Selected Members Chips */}
                    {selectedAssigneeIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {availableMembers
                                .filter((m) => selectedAssigneeIds.includes(m.id))
                                .map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center gap-2 px-2.5 py-1 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[3px] text-xs text-[var(--app-text)] shadow-xs"
                                    >
                                        <UserAvatar
                                            name={m.name}
                                            avatarUrl={m.avatarUrl}
                                            size="xs"
                                            title={m.name}
                                        />
                                        <span className="font-medium">{m.name}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedAssigneeIds((prev) =>
                                                    prev.filter((id) => id !== m.id)
                                                )
                                            }
                                            className="text-[var(--app-muted)] hover:text-[var(--color-error)] ml-1 transition-colors cursor-pointer"
                                            title={`Remove ${m.name}`}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </form>

            {/* ── Fixed Footer Action Bar ── */}
            <div className="px-6 py-4 border-t border-[var(--app-border)] bg-[var(--app-card)] shrink-0 flex items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading || isDeleting}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                    Delete Task
                </Button>

                <div className="flex items-center gap-2.5">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                        disabled={loading || isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleSubmit}
                        isLoading={loading}
                        loadingText="Saving..."
                        icon={<Check className="w-4 h-4" />}
                        disabled={loading || isDeleting || !title.trim()}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </SideSheetWrapper>
    );
}
