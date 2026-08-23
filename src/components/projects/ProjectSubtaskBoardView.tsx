"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, User, Layers, Calendar, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../api";

function getInitials(name: string) {
    if (!name) return "";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface ProjectSubtaskBoardViewProps {
    project: any;
    onRefresh?: () => void;
}

export default function ProjectSubtaskBoardView({ project, onRefresh }: ProjectSubtaskBoardViewProps) {
    const router = useRouter();
    const [filterAssignee, setFilterAssignee] = useState<string>("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Extract all subtasks across main tasks
    const allSubtasks: any[] = [];
    (project?.tasks || []).forEach((mainTask: any) => {
        (mainTask.subtasks || []).forEach((st: any) => {
            allSubtasks.push({
                ...st,
                parentTaskTitle: mainTask.title,
                parentTaskId: mainTask.id,
            });
        });
    });

    const filteredSubtasks = allSubtasks.filter((st) => {
        if (filterAssignee === "all") return true;
        const assigneeId = st.assignedToId || st.assignedTo?.id;
        return assigneeId === filterAssignee;
    });

    const todoSubtasks = filteredSubtasks.filter((st) => !st.isCompleted);
    const doneSubtasks = filteredSubtasks.filter((st) => st.isCompleted);

    const toggleSubtaskComplete = async (st: any) => {
        try {
            setUpdatingId(st.id);
            await api.updateProjectSubtask(project.id, st.parentTaskId, st.id, {
                isCompleted: !st.isCompleted,
            });
            toast.success(`Subtask marked as ${!st.isCompleted ? "completed" : "incomplete"}`);
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update subtask");
        } finally {
            setUpdatingId(null);
        }
    };

    // Extract unique assignees
    const assigneesMap = new Map<string, any>();
    allSubtasks.forEach((st) => {
        if (st.assignedTo) {
            assigneesMap.set(st.assignedTo.id, st.assignedTo);
        }
    });
    const uniqueAssignees = Array.from(assigneesMap.values());

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--app-bg)]">
            {/* Board Header & Filter */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--app-border)] bg-[var(--app-card)] shrink-0">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--app-text)]" />
                    <h3 className="text-xs font-semibold text-[var(--app-text)]">
                        Subtasks Board
                    </h3>
                    <span className="text-[10px] text-[var(--app-muted)] bg-[var(--app-bg)] px-2 py-0.5 rounded-full border border-[var(--app-border)]">
                        {filteredSubtasks.length} total subtasks
                    </span>
                </div>

                {/* Filter by Assignee */}
                {uniqueAssignees.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--app-muted)]">Assigned to:</span>
                        <select
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value)}
                            className="px-2 py-1 text-[11px] bg-[var(--app-bg)] border border-[var(--app-border)] text-[var(--app-text)] rounded-[2px] focus:outline-none"
                        >
                            <option value="all">All Members</option>
                            {uniqueAssignees.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name || u.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Subtask Kanban Columns */}
            <div className="flex-1 flex gap-4 p-4 overflow-x-auto overflow-y-hidden">
                {/* TO DO COLUMN */}
                <div className="w-80 shrink-0 bg-[var(--app-card)] border border-[var(--app-border)] flex flex-col rounded-[3px] max-h-full">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--app-border)] shrink-0">
                        <div className="flex items-center gap-2">
                            <Circle className="w-3.5 h-3.5 text-[var(--priority-medium)]" />
                            <h4 className="text-[11px] font-semibold text-[var(--app-text)]">In Progress / To Do</h4>
                            <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-full">
                                {todoSubtasks.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                        {todoSubtasks.length === 0 ? (
                            <div className="text-center py-8 text-[var(--app-muted)] text-[10px] border border-dashed border-[var(--app-border)] rounded-[2px]">
                                No pending subtasks
                            </div>
                        ) : (
                            todoSubtasks.map((st) => (
                                <div
                                    key={st.id}
                                    className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] transition-colors rounded-[2px] flex flex-col gap-2 group"
                                >
                                    {/* Parent Task Badge */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-semibold text-[var(--app-muted)] uppercase tracking-wider truncate max-w-[180px]">
                                            Main Task: {st.parentTaskTitle}
                                        </span>
                                        <button
                                            onClick={() => toggleSubtaskComplete(st)}
                                            disabled={updatingId === st.id}
                                            className="text-[var(--app-muted)] hover:text-[var(--color-success)] transition-colors cursor-pointer"
                                            title="Mark complete"
                                        >
                                            <Circle className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h5 className="text-[11px] font-medium text-[var(--app-text)] leading-snug">
                                        {st.title}
                                    </h5>

                                    {st.description && (
                                        <p className="text-[10px] text-[var(--app-muted)] line-clamp-2 leading-tight">
                                            {st.description}
                                        </p>
                                    )}

                                    {/* Single Assignee Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--app-border)]">
                                        {st.assignedTo ? (
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="w-5 h-5 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-card)] flex items-center justify-center text-[7px] font-semibold text-[var(--app-text)]"
                                                    title={st.assignedTo.name || st.assignedTo.fullName}
                                                >
                                                    {getInitials(st.assignedTo.name || st.assignedTo.fullName)}
                                                </div>
                                                <span className="text-[10px] text-[var(--app-text)] font-medium truncate max-w-[100px]">
                                                    {st.assignedTo.name || st.assignedTo.fullName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-[var(--app-muted)] italic">Unassigned</span>
                                        )}

                                        {st.dueDate && (
                                            <div className="flex items-center gap-1 text-[9px] text-[var(--app-muted)]">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(st.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COMPLETED COLUMN */}
                <div className="w-80 shrink-0 bg-[var(--app-card)] border border-[var(--app-border)] flex flex-col rounded-[3px] max-h-full">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--app-border)] shrink-0">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
                            <h4 className="text-[11px] font-semibold text-[var(--app-text)]">Completed</h4>
                            <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-bg)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-full">
                                {doneSubtasks.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                        {doneSubtasks.length === 0 ? (
                            <div className="text-center py-8 text-[var(--app-muted)] text-[10px] border border-dashed border-[var(--app-border)] rounded-[2px]">
                                No completed subtasks yet
                            </div>
                        ) : (
                            doneSubtasks.map((st) => (
                                <div
                                    key={st.id}
                                    className="p-3 bg-[var(--app-bg)] border border-[var(--app-border)] opacity-85 hover:opacity-100 transition-opacity rounded-[2px] flex flex-col gap-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-semibold text-[var(--app-muted)] uppercase tracking-wider truncate max-w-[180px]">
                                            Main Task: {st.parentTaskTitle}
                                        </span>
                                        <button
                                            onClick={() => toggleSubtaskComplete(st)}
                                            disabled={updatingId === st.id}
                                            className="text-[var(--color-success)] hover:text-[var(--app-muted)] transition-colors cursor-pointer"
                                            title="Mark incomplete"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h5 className="text-[11px] font-medium text-[var(--app-text)] line-through leading-snug">
                                        {st.title}
                                    </h5>

                                    <div className="flex items-center justify-between pt-2 border-t border-[var(--app-border)]">
                                        {st.assignedTo ? (
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="w-5 h-5 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-card)] flex items-center justify-center text-[7px] font-semibold text-[var(--app-text)]"
                                                    title={st.assignedTo.name || st.assignedTo.fullName}
                                                >
                                                    {getInitials(st.assignedTo.name || st.assignedTo.fullName)}
                                                </div>
                                                <span className="text-[10px] text-[var(--app-muted)] font-medium truncate max-w-[100px]">
                                                    {st.assignedTo.name || st.assignedTo.fullName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] text-[var(--app-muted)] italic">Unassigned</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
