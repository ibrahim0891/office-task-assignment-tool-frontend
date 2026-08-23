"use client";

import React from "react";
import type { MockProject, MockSuperTask } from "./mockProjectData";

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getBarColor(status: string) {
    switch (status) {
        case "Completed": case "Done": return "bg-[var(--color-success)]";
        case "InProgress": return "bg-[var(--color-warning)]";
        case "InReview": return "bg-[var(--priority-medium)]";
        case "AtRisk": case "Blocked": return "bg-[var(--color-error)]";
        case "PendingAcceptance": return "bg-[var(--app-muted)]/50";
        default: return "bg-[var(--app-border-strong)]";
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case "Completed": case "Done": return "Completed";
        case "InProgress": return "In Progress";
        case "InReview": return "In Review";
        case "AtRisk": return "At Risk";
        case "Blocked": return "Blocked";
        case "PendingAcceptance": return "Pending";
        default: return "Backlog";
    }
}

// Generate day column headers for a 14-day window
function generateDayColumns(startDate: string): { date: string; label: string; isWeekend: boolean }[] {
    const days: { date: string; label: string; isWeekend: boolean }[] = [];
    const start = new Date(startDate);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let count = 0;
    const cursor = new Date(start);
    while (count < 14) {
        const dayOfWeek = cursor.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        days.push({
            date: cursor.toISOString().split("T")[0],
            label: `${dayNames[dayOfWeek]} ${cursor.getDate()}`,
            isWeekend,
        });
        cursor.setDate(cursor.getDate() + 1);
        count++;
    }
    return days;
}

// Calculate bar position as percentage within the timeline
function getBarPosition(
    taskStart: string,
    taskEnd: string,
    timelineStart: string,
    totalDays: number
) {
    const tStart = new Date(timelineStart).getTime();
    const bStart = new Date(taskStart).getTime();
    const bEnd = new Date(taskEnd).getTime();
    const dayMs = 86400000;

    const startOffset = Math.max(0, (bStart - tStart) / dayMs);
    const endOffset = Math.min(totalDays, (bEnd - tStart) / dayMs + 1);
    const left = (startOffset / totalDays) * 100;
    const width = ((endOffset - startOffset) / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
}

interface ProjectTimelineViewProps {
    project: MockProject;
}

export default function ProjectTimelineView({ project }: ProjectTimelineViewProps) {
    const timelineStart = project.startDate;
    const dayColumns = generateDayColumns(timelineStart);
    const totalDays = dayColumns.length;

    // Flatten to get a combined list: super tasks and their subtasks
    const timelineRows: {
        id: string;
        title: string;
        assignee: string;
        startDate: string;
        dueDate: string;
        status: string;
        isSubtask: boolean;
        isCriticalPath: boolean;
        parentId?: string;
    }[] = [];

    const criticalTaskIds = new Set<string>();
    // Find tasks on the critical path (tasks that are predecessors with zero slack — simplified: just check if they have successors)
    project.dependencies.forEach((dep) => {
        criticalTaskIds.add(dep.predecessorTaskId);
        criticalTaskIds.add(dep.successorTaskId);
    });

    project.tasks.forEach((task) => {
        timelineRows.push({
            id: task.id,
            title: task.title,
            assignee: task.assignees.map((a) => a.name.split(" ")[0]).join(", "),
            startDate: task.startDate,
            dueDate: task.dueDate,
            status: task.status,
            isSubtask: false,
            isCriticalPath: criticalTaskIds.has(task.id),
        });

        task.subtasks.forEach((sub) => {
            timelineRows.push({
                id: sub.id,
                title: sub.title,
                assignee: sub.assignedTo.name.split(" ")[0],
                startDate: sub.startDate,
                dueDate: sub.dueDate,
                status: sub.status,
                isSubtask: true,
                isCriticalPath: false,
                parentId: task.id,
            });
        });
    });

    return (
        <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-[9px] text-[var(--app-muted)] shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 bg-[var(--color-success)] rounded-[1px]" />
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 bg-[var(--color-warning)] rounded-[1px]" />
                    <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 bg-[var(--priority-medium)] rounded-[1px]" />
                    <span>In Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 bg-[var(--color-error)] rounded-[1px]" />
                    <span>At Risk / Blocked</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 bg-[var(--app-border-strong)] rounded-[1px]" />
                    <span>Backlog</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-3 border-l-2 border-[var(--color-error)]" />
                    <span>Critical Path</span>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets rounded-[2px] overflow-hidden">
                {/* Header Row: Day columns */}
                <div className="flex border-b border-[var(--app-border)]">
                    {/* Task name column header */}
                    <div className="w-56 shrink-0 px-3 py-2 border-r border-[var(--app-border)] bg-[var(--app-bg)]">
                        <span className="eyebrow">Task</span>
                    </div>
                    {/* Day columns */}
                    <div className="flex-1 flex">
                        {dayColumns.map((day) => (
                            <div
                                key={day.date}
                                className={`flex-1 min-w-[50px] text-center px-1 py-2 text-[8px] font-medium border-r border-[var(--app-border)] last:border-r-0 ${
                                    day.isWeekend
                                        ? "bg-[var(--app-bg)] text-[var(--app-muted)]/50"
                                        : "bg-[var(--app-bg)] text-[var(--app-muted)]"
                                }`}
                            >
                                {day.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                {timelineRows.length === 0 ? (
                    <div className="text-center py-12 text-[var(--app-muted)] text-[11px]">
                        No tasks to display on the timeline.
                    </div>
                ) : (
                    timelineRows.map((row) => {
                        const barPos = getBarPosition(row.startDate, row.dueDate, timelineStart, totalDays);

                        return (
                            <div
                                key={row.id}
                                className={`flex border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-hover-bg)] transition-colors ${
                                    row.isSubtask ? "bg-transparent" : ""
                                }`}
                            >
                                {/* Task Label */}
                                <div
                                    className={`w-56 shrink-0 px-3 py-2 border-r border-[var(--app-border)] flex items-center gap-2 ${
                                        row.isSubtask ? "pl-8" : ""
                                    }`}
                                >
                                    {row.isCriticalPath && (
                                        <div className="w-1 h-4 bg-[var(--color-error)] rounded-[1px] shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <span
                                            className={`block truncate ${
                                                row.isSubtask
                                                    ? "text-[9px] text-[var(--app-muted)]"
                                                    : "text-[10px] font-medium text-[var(--app-text)]"
                                            }`}
                                        >
                                            {row.title}
                                        </span>
                                        <span className="text-[8px] text-[var(--app-muted)] truncate block">
                                            {row.assignee}
                                        </span>
                                    </div>
                                </div>

                                {/* Gantt Bar Area */}
                                <div className="flex-1 relative min-h-[36px]">
                                    {/* Background grid lines */}
                                    <div className="absolute inset-0 flex">
                                        {dayColumns.map((day) => (
                                            <div
                                                key={day.date}
                                                className={`flex-1 min-w-[50px] border-r border-[var(--app-border)]/30 last:border-r-0 ${
                                                    day.isWeekend ? "bg-[var(--app-bg)]/50" : ""
                                                }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Bar */}
                                    <div
                                        className={`absolute top-1/2 -translate-y-1/2 ${
                                            row.isSubtask ? "h-2" : "h-3"
                                        } ${getBarColor(row.status)} rounded-[2px] z-10 ${
                                            row.isCriticalPath ? "border-l-2 border-l-[var(--color-error)]" : ""
                                        }`}
                                        style={{ left: barPos.left, width: barPos.width }}
                                        title={`${row.title}: ${row.startDate} → ${row.dueDate} (${getStatusLabel(row.status)})`}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Dependencies Legend */}
            {project.dependencies.length > 0 && (
                <div className="relative bg-[var(--app-card)] border border-[var(--app-border)] corner-brackets rounded-[2px] p-4 flex flex-col gap-2">
                    <h3 className="text-[11px] font-semibold text-[var(--app-text)]">
                        ▪ Task Dependencies
                    </h3>
                    <div className="flex flex-col gap-1.5">
                        {project.dependencies.map((dep) => {
                            const pred = project.tasks.find((t) => t.id === dep.predecessorTaskId);
                            const succ = project.tasks.find((t) => t.id === dep.successorTaskId);
                            if (!pred || !succ) return null;

                            return (
                                <div
                                    key={dep.id}
                                    className="flex items-center gap-2 text-[10px] text-[var(--app-muted)] py-1 px-2 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-bg)]"
                                >
                                    <span className="font-medium text-[var(--app-text)] truncate max-w-[180px]">
                                        {pred.title}
                                    </span>
                                    <span className="text-[8px] px-1.5 py-0.5 border border-[var(--app-border)] rounded-[2px] bg-[var(--app-card)] shrink-0">
                                        {dep.dependencyType === "FinishToStart" ? "FS" : "SS"}
                                    </span>
                                    <span className="text-[var(--app-muted)]">→</span>
                                    <span className="font-medium text-[var(--app-text)] truncate max-w-[180px]">
                                        {succ.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
