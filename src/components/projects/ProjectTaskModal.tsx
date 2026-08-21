"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Circle, AlertTriangle, User, Calendar, Plus, Clock, ShieldAlert } from "lucide-react";
import type { MockSuperTask, MockSubtask, MockProject } from "./mockProjectData";

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getPriorityBadge(priority: string) {
    switch (priority) {
        case "Urgent":
            return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
        case "High":
            return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
        case "Medium":
            return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
        default:
            return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
    }
}

interface ProjectTaskModalProps {
    task: MockSuperTask | null;
    project: MockProject;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProjectTaskModal({ task, project, isOpen, onClose }: ProjectTaskModalProps) {
    if (!isOpen || !task) return null;

    const [subtasks, setSubtasks] = useState<MockSubtask[]>(task.subtasks || []);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [selectedAssigneeId, setSelectedAssigneeId] = useState(task.assignees[0]?.id || "");
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);

    const toggleSubtask = (id: string) => {
        setSubtasks((prev) =>
            prev.map((st) =>
                st.id === id
                    ? { ...st, status: st.status === "Done" ? "InProgress" : "Done" }
                    : st
            )
        );
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        const assignee = project.members.find((m) => m.userId === selectedAssigneeId)?.user || task.assignees[0] || {
            id: "u1",
            name: "Unassigned",
            email: "",
        };

        const newSt: MockSubtask = {
            id: `st-${Date.now()}`,
            title: newSubtaskTitle.trim(),
            assignedToId: assignee.id,
            assignedTo: assignee,
            startDate: task.startDate,
            dueDate: task.dueDate,
            estimatedDays: 1,
            actualDaysLogged: 0,
            status: "InProgress",
        };

        setSubtasks((prev) => [...prev, newSt]);
        setNewSubtaskTitle("");
        setIsAddingSubtask(false);
    };

    const completedCount = subtasks.filter((s) => s.status === "Done").length;
    const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in select-none">
            <div
                className="relative w-full max-w-2xl bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets shadow-2xl rounded-[3px] flex flex-col max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between p-4 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                    <div className="flex flex-col gap-1 pr-6 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-[2px] border ${getPriorityBadge(task.priority)}`}>
                                {task.priority} Priority
                            </span>
                            <span className="text-[9px] text-[var(--app-muted)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px]">
                                {task.effortMode} Effort
                            </span>
                            {task.riskLevel === "AtRisk" && (
                                <span className="text-[9px] text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-1.5 py-0.5 rounded-[2px] flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" /> At Risk
                                </span>
                            )}
                            {task.riskLevel === "Overdue" && (
                                <span className="text-[9px] text-[var(--color-error)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-1.5 py-0.5 rounded-[2px] flex items-center gap-1">
                                    <ShieldAlert className="w-2.5 h-2.5" /> Overdue
                                </span>
                            )}
                        </div>
                        <h2 className="text-[14px] font-semibold text-[var(--app-text)] leading-snug mt-1">
                            {task.title}
                        </h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-[var(--app-muted)] hover:text-[var(--app-text)] p-1 rounded-[2px] hover:bg-[var(--app-hover-bg)] transition-colors cursor-pointer shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                    {/* Description */}
                    {task.description && (
                        <div>
                            <span className="eyebrow block mb-1">Description</span>
                            <p className="text-[11px] text-[var(--app-text)] leading-relaxed bg-[var(--app-bg)] p-3 border border-[var(--app-border)] rounded-[2px]">
                                {task.description}
                            </p>
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div className="p-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] flex flex-col gap-1">
                            <span className="text-[var(--app-muted)] flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Timeline
                            </span>
                            <span className="font-medium text-[var(--app-text)]">
                                {task.startDate} → {task.dueDate}
                            </span>
                        </div>
                        <div className="p-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] flex flex-col gap-1">
                            <span className="text-[var(--app-muted)] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Estimated Span
                            </span>
                            <span className="font-medium text-[var(--app-text)]">
                                {task.estimatedDays} days
                            </span>
                        </div>
                        <div className="p-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[2px] flex flex-col gap-1 sm:col-span-2">
                            <span className="text-[var(--app-muted)] flex items-center gap-1">
                                <User className="w-3 h-3" /> Super Task Assignees
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {task.assignees.map((user) => (
                                    <span
                                        key={user.id}
                                        className="inline-flex items-center gap-1 bg-[var(--app-card)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium text-[var(--app-text)]"
                                    >
                                        <span className="w-3.5 h-3.5 rounded-full bg-[var(--app-bg)] border border-[var(--app-border-strong)] flex items-center justify-center text-[7px]">
                                            {getInitials(user.name)}
                                        </span>
                                        {user.name.split(" ")[0]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Blocker Alert if present */}
                    {task.blockerReason && (
                        <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-[2px] flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" />
                            <div>
                                <span className="text-[10px] font-semibold text-[var(--color-error)] block">
                                    Blocker: {task.blockerCategory || "Active Blocker"}
                                </span>
                                <p className="text-[10px] text-[var(--app-text)] mt-0.5">
                                    {task.blockerReason}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SUBTASKS SECTION */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[12px] font-semibold text-[var(--app-text)]">
                                    ▪ 1-to-1 Subtasks ({completedCount}/{subtasks.length})
                                </h3>
                            </div>
                            <span className="text-[10px] font-medium text-[var(--app-muted)] tabular-nums">
                                {progressPct}% done
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-[var(--app-bg)] border border-[var(--app-border)] rounded-[1px] overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-success)] transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>

                        {/* Subtask List */}
                        <div className="flex flex-col gap-1.5">
                            {subtasks.length === 0 ? (
                                <div className="text-center py-6 text-[var(--app-muted)] text-[10px] border border-dashed border-[var(--app-border)] rounded-[2px]">
                                    No subtasks created for this task yet.
                                </div>
                            ) : (
                                subtasks.map((st) => {
                                    const isDone = st.status === "Done";
                                    return (
                                        <div
                                            key={st.id}
                                            onClick={() => toggleSubtask(st.id)}
                                            className={`p-2.5 bg-[var(--app-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[2px] flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                                isDone ? "opacity-60" : ""
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {isDone ? (
                                                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                                                ) : (
                                                    <Circle className="w-4 h-4 text-[var(--app-muted)] shrink-0" />
                                                )}
                                                <span
                                                    className={`text-[11px] text-[var(--app-text)] truncate ${
                                                        isDone ? "line-through text-[var(--app-muted)]" : "font-medium"
                                                    }`}
                                                >
                                                    {st.title}
                                                </span>
                                            </div>

                                            {/* Subtask Assignee & Dates */}
                                            <div className="flex items-center gap-3 shrink-0 text-[9px] text-[var(--app-muted)]">
                                                <span>{st.startDate} → {st.dueDate}</span>
                                                <div
                                                    className="flex items-center gap-1 bg-[var(--app-card)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-[2px] font-medium text-[var(--app-text)]"
                                                    title={st.assignedTo.name}
                                                >
                                                    <span className="w-3.5 h-3.5 rounded-full bg-[var(--app-bg)] border border-[var(--app-border-strong)] flex items-center justify-center text-[7px]">
                                                        {getInitials(st.assignedTo.name)}
                                                    </span>
                                                    <span>{st.assignedTo.name.split(" ")[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Add Subtask Form */}
                        {isAddingSubtask ? (
                            <form onSubmit={handleAddSubtask} className="border border-[var(--app-border)] p-3 bg-[var(--app-bg)] rounded-[2px] flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter subtask title..."
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    className="w-full bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-2.5 py-1.5 text-[11px] text-[var(--app-text)] focus:outline-none focus:border-[var(--app-text)]"
                                    autoFocus
                                    required
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="text-[var(--app-muted)]">Assign To:</span>
                                        <select
                                            value={selectedAssigneeId}
                                            onChange={(e) => setSelectedAssigneeId(e.target.value)}
                                            className="bg-[var(--app-card)] border border-[var(--app-border)] rounded-[2px] px-2 py-1 text-[10px] text-[var(--app-text)]"
                                        >
                                            {task.assignees.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingSubtask(false)}
                                            className="px-2.5 py-1 text-[10px] text-[var(--app-muted)] hover:text-[var(--app-text)] rounded-[2px]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-[var(--app-text)] text-[var(--app-card)] font-medium text-[10px] px-3 py-1 rounded-[2px] cursor-pointer"
                                        >
                                            Add Subtask
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAddingSubtask(true)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-hover-bg)] border border-dashed border-[var(--app-border)] rounded-[2px] transition-colors cursor-pointer"
                            >
                                <Plus className="w-3 h-3" />
                                Add Subtask (1-to-1 Assignment)
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3 border-t border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-between shrink-0">
                    <span className="text-[9px] text-[var(--app-muted)]">
                        Super Task ID: {task.id}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1 bg-[var(--app-card)] hover:bg-[var(--app-hover-bg)] border border-[var(--app-border)] text-[var(--app-text)] text-[10px] font-medium rounded-[2px] transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
