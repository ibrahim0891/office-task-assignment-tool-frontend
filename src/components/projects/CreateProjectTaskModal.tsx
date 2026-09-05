"use client";

import React, { useState, useEffect } from "react";
import { Plus, Users, Calendar, Clock, Loader2, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";
import { CustomSelect } from "../ui/CustomSelect";
import { CustomDatePicker } from "../ui/CustomDatePicker";
import { TipTapEditor } from "../ui/TipTapEditor";
import ModalWrapper from "../ui/ModalWrapper";
import { UserAvatar } from "../ui/UserAvatar";
import { calculateDaySpan, formatDaySpan } from "../../utils/date";

interface CreateProjectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    defaultColumnId?: string;
    onRefresh?: (silent?: boolean) => void;
}

function getInitials(name: string) {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function CreateProjectTaskModal({
    isOpen,
    onClose,
    project,
    defaultColumnId,
    onRefresh,
}: CreateProjectTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [columnId, setColumnId] = useState("");
    const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
    const [priority, setPriority] = useState("MEDIUM");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    const columns = (project?.columns || []).slice().sort((a: any, b: any) => a.order - b.order);

    // Calculate project bounds (YYYY-MM-DD)
    const projMinDate = project?.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "";
    const projMaxDate = project?.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "";

    // Consolidate project members and manager into selectable list
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
        if (isOpen) {
            setTitle("");
            setDescription("");
            setColumnId(defaultColumnId || (columns[0]?.id || ""));
            setSelectedAssigneeIds([]);
            setPriority("MEDIUM");

            // Set initial start date within project bounds
            const todayStr = new Date().toISOString().split("T")[0];
            let initialStart = todayStr;
            if (projMinDate && initialStart < projMinDate) {
                initialStart = projMinDate;
            } else if (projMaxDate && initialStart > projMaxDate) {
                initialStart = projMinDate || projMaxDate;
            }
            setStartDate(initialStart);

            // Set initial due date within project bounds
            const defaultDue = new Date();
            defaultDue.setDate(defaultDue.getDate() + 7);
            let dueStr = defaultDue.toISOString().split("T")[0];
            if (projMaxDate && dueStr > projMaxDate) {
                dueStr = projMaxDate;
            }
            if (projMinDate && dueStr < projMinDate) {
                dueStr = projMaxDate || projMinDate;
            }
            setDueDate(dueStr);
        }
    }, [isOpen, defaultColumnId, project?.startDate, project?.endDate]);

    if (!isOpen) return null;

    const toggleAssignee = (userId: string) => {
        setSelectedAssigneeIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

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

        // Validate date boundaries against project timeline
        if (projMinDate && startDate < projMinDate) {
            toast.error(`Start date cannot be earlier than project start date (${projMinDate})`);
            return;
        }
        if (projMaxDate && startDate > projMaxDate) {
            toast.error(`Start date cannot be later than project end date (${projMaxDate})`);
            return;
        }
        if (projMinDate && dueDate < projMinDate) {
            toast.error(`Due date cannot be earlier than project start date (${projMinDate})`);
            return;
        }
        if (projMaxDate && dueDate > projMaxDate) {
            toast.error(`Due date cannot be later than project end date (${projMaxDate})`);
            return;
        }
        if (startDate > dueDate) {
            toast.error("Start date cannot be later than due date");
            return;
        }

        try {
            setLoading(true);
            const calculatedEstimatedDays = calculateDaySpan(startDate, dueDate);
            await api.createProjectTask(project.id, {
                title: title.trim(),
                description: description.trim(),
                columnId: targetColId,
                assigneeIds: selectedAssigneeIds,
                startDate,
                dueDate,
                priority,
                estimatedDays: calculatedEstimatedDays,
            });

            toast.success("Main task created! Assigned members notified.");
            onClose();
            if (onRefresh) onRefresh(true);
        } catch (err: any) {
            toast.error(err.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-xl"
            className="p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto scrollbar-none text-left"
        >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--app-border)]">
                    <h2 className="text-base font-semibold text-[var(--app-text)] flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[var(--app-text)]" />
                        Create New Main Task
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] text-sm font-bold px-1 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    {/* Task Title */}
                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">
                            Task Title <span className="text-[var(--color-error)]">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title..."
                            autoFocus
                            required
                            className="w-full px-3 py-1.5 text-xs bg-[var(--app-card)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none focus:border-[var(--app-border-strong)]"
                        />
                    </div>

                    {/* Description - TipTap Editor */}
                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Description</label>
                        <TipTapEditor
                            value={description}
                            onChange={(html) => setDescription(html)}
                        />
                    </div>

                    {/* Priority selection */}
                    <div className="flex flex-col gap-1">
                        <label className="eyebrow">Priority</label>
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

                    {/* Start Date & Due Date Grid with Estimated Day Count */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="eyebrow flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                <span>Task Dates</span>
                            </label>
                            {startDate && dueDate && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--app-text)] bg-[var(--app-bg)] px-2 py-0.5 rounded-[2px] border border-[var(--app-border)] tabular-nums">
                                    <Clock className="w-3 h-3 text-[var(--app-muted)]" />
                                    <span>Estimated Span: {formatDaySpan(calculateDaySpan(startDate, dueDate))}</span>
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)]">Start Date</span>
                                <CustomDatePicker
                                    value={startDate}
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
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[var(--app-muted)]">Due Date</span>
                                <CustomDatePicker
                                    value={dueDate}
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
                                    }}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        {(projMinDate || projMaxDate) && (
                            <span className="text-[9px] text-[var(--app-muted)] italic">
                                Project bounds: {projMinDate || "Start"} to {projMaxDate || "End"}
                            </span>
                        )}
                    </div>

                    {/* Member Multi-Select Dropdown & Selected Chips */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="eyebrow flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[var(--app-muted)]" />
                                Assign Members
                            </label>
                            <span className="text-[10px] text-[var(--app-muted)] font-medium tabular-nums">
                                {selectedAssigneeIds.length} assigned
                            </span>
                        </div>

                        {/* Searchable Dropdown for Unassigned Members */}
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
                            <div className="text-[11px] text-[var(--app-muted)] italic p-2 border border-dashed border-[var(--app-border)] rounded-[2px] text-center">
                                All project members assigned
                            </div>
                        )}

                        {/* Selected Members Chips */}
                        {selectedAssigneeIds.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {availableMembers
                                    .filter((m) => selectedAssigneeIds.includes(m.id))
                                    .map((m) => (
                                        <div
                                            key={m.id}
                                            className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] text-[11px] text-[var(--app-text)]"
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
                                                className="text-[var(--app-muted)] hover:text-[var(--color-error)] ml-0.5"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Actions */}
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
                            disabled={loading || !title.trim()}
                            className="relative corner-brackets-4 px-4 py-1.5 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text)] font-medium text-[11px] rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                        >
                            {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-[var(--app-text)]" />
                            ) : (
                                <Plus className="w-3.5 h-3.5 text-[var(--app-text)]" />
                            )}
                            <span>{loading ? "Creating..." : "Create Task"}</span>
                        </button>
                    </div>
                </form>
        </ModalWrapper>
    );
}
