"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { MockProject, MockSuperTask } from "./mockProjectData";

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getPriorityStyle(priority: string) {
    switch (priority) {
        case "Urgent": return "text-[var(--priority-urgent)] bg-[var(--priority-urgent)]/10 border-[var(--priority-urgent)]/20";
        case "High": return "text-[var(--priority-high)] bg-[var(--priority-high)]/10 border-[var(--priority-high)]/20";
        case "Medium": return "text-[var(--priority-medium)] bg-[var(--priority-medium)]/10 border-[var(--priority-medium)]/20";
        default: return "text-[var(--priority-low)] bg-[var(--priority-low)]/10 border-[var(--priority-low)]/20";
    }
}

function getRiskBadge(riskLevel: string) {
    switch (riskLevel) {
        case "AtRisk": return { label: "At Risk", cls: "text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20" };
        case "Overdue": return { label: "Overdue", cls: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20" };
        case "CriticalSLA": return { label: "SLA Breach", cls: "text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20" };
        default: return null;
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case "Done": return "text-[var(--color-success)]";
        case "InProgress": return "text-[var(--color-warning)]";
        case "InReview": return "text-[var(--priority-medium)]";
        case "Blocked": case "AtRisk": return "text-[var(--color-error)]";
        case "PendingAcceptance": return "text-[var(--priority-low)]";
        default: return "text-[var(--app-muted)]";
    }
}

function TaskCard({
    task,
    projectId,
}: {
    task: MockSuperTask;
    projectId: string;
}) {
    const router = useRouter();
    const doneSubtasks = task.subtasks.filter((s) => s.status === "Done").length;
    const totalSubtasks = task.subtasks.length;
    const riskBadge = getRiskBadge(task.riskLevel);

    return (
        <div
            onClick={() => router.push(`/projects/${projectId}/tasks/${task.id}`)}
            className="p-3 bg-[var(--app-card)] border border-[var(--app-border)] hover:border-[var(--app-border-strong)] transition-colors cursor-pointer flex flex-col gap-2 group rounded-[2px]"
        >
            {/* Priority + Risk */}
            <div className="flex items-center justify-between gap-1.5">
                <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${getPriorityStyle(task.priority)}`}>
                    {task.priority}
                </span>
                {riskBadge && (
                    <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-[2px] border ${riskBadge.cls}`}>
                        {riskBadge.label}
                    </span>
                )}
            </div>

            {/* Title */}
            <h4 className="text-[11px] font-medium text-[var(--app-text)] leading-snug">
                {task.title}
            </h4>

            {/* Date Range */}
            <div className="text-[9px] text-[var(--app-muted)]">
                {task.startDate} → {task.dueDate}
            </div>

            {/* Footer: Assignees + Subtask Progress */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--app-border)]">
                {/* Assignee Avatars */}
                <div className="flex -space-x-1.5">
                    {task.assignees.slice(0, 4).map((user) => (
                        <div
                            key={user.id}
                            className="w-5 h-5 rounded-full border border-[var(--app-border-strong)] bg-[var(--app-bg)] flex items-center justify-center text-[7px] font-semibold text-[var(--app-text)] shrink-0"
                            title={user.name}
                        >
                            {getInitials(user.name)}
                        </div>
                    ))}
                    {task.assignees.length > 4 && (
                        <div className="w-5 h-5 rounded-full border border-[var(--app-border)] bg-[var(--app-bg)] flex items-center justify-center text-[7px] text-[var(--app-muted)] shrink-0">
                            +{task.assignees.length - 4}
                        </div>
                    )}
                </div>

                {/* Subtask Count */}
                {totalSubtasks > 0 && (
                    <span className={`text-[9px] font-medium tabular-nums ${getStatusColor(task.status)}`}>
                        {doneSubtasks}/{totalSubtasks} subtasks
                    </span>
                )}
            </div>

            {/* Rework Badge */}
            {task.reworkCount > 0 && (
                <div className="text-[8px] text-[var(--color-warning)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 px-1.5 py-0.5 rounded-[2px] w-fit">
                    {task.reworkCount}× rework
                </div>
            )}
        </div>
    );
}

interface ProjectBoardViewProps {
    project: MockProject;
}

export default function ProjectBoardView({ project }: ProjectBoardViewProps) {
    const columnTaskMap: Record<string, MockSuperTask[]> = {};
    project.columns.forEach((col) => {
        columnTaskMap[col.id] = project.tasks.filter((t) => t.columnId === col.id);
    });

    return (
        <div className="flex-1 flex gap-4 p-4 overflow-x-auto overflow-y-hidden">
            {project.columns.map((col) => {
                const colTasks = columnTaskMap[col.id] || [];
                const isDoneCol = col.name === "Done";

                return (
                    <div
                        key={col.id}
                        className="w-72 shrink-0 bg-[var(--app-bg)] border border-[var(--app-border)] flex flex-col rounded-[3px] max-h-full"
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--app-border)] shrink-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[11px] font-semibold text-[var(--app-text)]">
                                    {col.name}
                                </h3>
                                <span className="text-[9px] font-medium text-[var(--app-muted)] bg-[var(--app-card)] border border-[var(--app-border)] px-1.5 py-0.5 rounded-full tabular-nums">
                                    {colTasks.length}
                                </span>
                            </div>
                        </div>

                        {/* Task Cards */}
                        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                            {colTasks.length === 0 ? (
                                <div className="text-center py-8 text-[var(--app-muted)] text-[10px] border border-dashed border-[var(--app-border)] rounded-[2px]">
                                    No tasks
                                </div>
                            ) : (
                                colTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        projectId={project.id}
                                    />
                                ))
                            )}
                        </div>

                        {/* Add Task Placeholder */}
                        {!isDoneCol && (
                            <div className="px-2 pb-2 shrink-0">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-card)] border border-dashed border-[var(--app-border)] hover:border-[var(--app-border-strong)] rounded-[2px] transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Task
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
