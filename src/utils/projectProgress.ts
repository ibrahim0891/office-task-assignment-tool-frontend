/**
 * Project and Task Fine-Grained Progress Engine
 * 
 * 4-Stage Workflow Progression:
 * 1. To Do (0%)
 * 2. In Progress (25%)
 * 3. Under Review (75%)
 * 4. Completed (100%)
 */

import { calculateRemainingDays, calculateDaySpan } from "./date";

export const STAGE_TAG_OPTIONS = [
    {
        id: "TODO",
        label: "Stage 1: To Do / Backlog",
        shortLabel: "To Do",
        weight: 0,
        showWeight: false,
        color: "text-[var(--status-todo,#6B7280)]",
        bg: "bg-[var(--status-todo,#6B7280)]/10",
        border: "border-[var(--status-todo,#6B7280)]/30",
        dot: "bg-[var(--status-todo,#6B7280)]",
        description: "Initial unstarted queue (0% progress)",
    },
    {
        id: "IN_PROGRESS",
        label: "Stage 2: In Progress / Active",
        shortLabel: "In Progress",
        weight: 25,
        showWeight: true,
        color: "text-[var(--status-in-progress,#7C3AED)]",
        bg: "bg-[var(--status-in-progress,#7C3AED)]/10",
        border: "border-[var(--status-in-progress,#7C3AED)]/30",
        dot: "bg-[var(--status-in-progress,#7C3AED)]",
        description: "Active development or execution (25% progress)",
    },
    {
        id: "IN_REVIEW",
        label: "Stage 3: In Review / Testing",
        shortLabel: "In Review",
        weight: 75,
        showWeight: true,
        color: "text-[var(--status-at-risk,#D97706)]",
        bg: "bg-[var(--status-at-risk,#D97706)]/10",
        border: "border-[var(--status-at-risk,#D97706)]/30",
        dot: "bg-[var(--status-at-risk,#D97706)]",
        description: "QA verification, review, or testing (75% progress)",
    },
    {
        id: "DONE",
        label: "Stage 4: Done / Completed",
        shortLabel: "Done",
        weight: 100,
        showWeight: true,
        color: "text-[var(--status-completed,#15803D)]",
        bg: "bg-[var(--status-completed,#15803D)]/10",
        border: "border-[var(--status-completed,#15803D)]/30",
        dot: "bg-[var(--status-completed,#15803D)]",
        description: "Finished and deployed milestone (100% progress)",
    },
] as const;

export const STAGE_PROGRESS_WEIGHTS: Record<string, number> = {
    CUSTOM: 0,
    UNWEIGHTED: 0,
    TODO: 0,
    IN_PROGRESS: 25,
    IN_REVIEW: 75,
    DONE: 100,
};

/**
 * Returns the progress weight (0, 25, 75, 100) for a column or status name.
 */
export function getStageWeight(columnOrStatus: any): number {
    if (!columnOrStatus) return 0;

    // Direct object or string input
    const isComplete = typeof columnOrStatus === "object" ? Boolean(columnOrStatus.isComplete) : false;
    if (isComplete) return 100;

    // Direct stage tag match
    const typeOrTag = (typeof columnOrStatus === "object" ? (columnOrStatus.type || columnOrStatus.stageTag || "") : "").toUpperCase();
    if (typeOrTag === "CUSTOM" || typeOrTag === "UNWEIGHTED") return 0;
    if (typeOrTag === "DONE" || typeOrTag === "COMPLETED") return 100;
    if (typeOrTag === "IN_REVIEW" || typeOrTag === "REVIEW" || typeOrTag === "NEED_ATTENTION") return 75;
    if (typeOrTag === "IN_PROGRESS" || typeOrTag === "PROGRESS") return 25;
    if (typeOrTag === "TODO" || typeOrTag === "TO_DO" || typeOrTag === "BACKLOG") return 0;

    const rawName = (typeof columnOrStatus === "object" ? (columnOrStatus.name || columnOrStatus.type || "") : String(columnOrStatus)).toLowerCase().trim();

    if (rawName.includes("done") || rawName.includes("complete") || rawName === "closed") {
        return 100;
    }
    if (rawName.includes("review") || rawName.includes("qa") || rawName.includes("test") || rawName.includes("staging") || rawName.includes("approval")) {
        return 75;
    }
    if (rawName.includes("progress") || rawName.includes("doing") || rawName.includes("dev") || rawName.includes("active") || rawName.includes("work")) {
        return 25;
    }
    if (rawName.includes("todo") || rawName.includes("to do") || rawName.includes("backlog") || rawName.includes("open")) {
        return 0;
    }

    return 0;
}

/**
 * Returns stage metadata and badge for a column
 */
export function getStageMeta(column: any): { label: string; stageNumber: number; weight: number; isSystem: boolean; tagId: string; showWeight: boolean } {
    const rawTag = (typeof column === "object" ? (column?.type || column?.stageTag || "") : "").toUpperCase();
    const isCustomUnweighted = rawTag === "CUSTOM" || rawTag === "UNWEIGHTED";

    const isSystem = column?.type === "SYSTEM" || ["col-todo", "col-progress", "col-review", "col-done"].includes(column?.id);
    const weight = getStageWeight(column);

    if (isCustomUnweighted && !column?.isComplete) {
        return {
            label: "No Stage (Unweighted)",
            stageNumber: 0,
            weight: 0,
            isSystem,
            tagId: "CUSTOM",
            showWeight: false,
        };
    }

    let label = "Stage 1: To Do";
    let stageNumber = 1;
    let tagId = "TODO";
    let showWeight = false;

    if (weight === 100 || column?.isComplete) {
        label = "Stage 4: Completed";
        stageNumber = 4;
        tagId = "DONE";
        showWeight = true;
    } else if (weight === 75 || rawTag === "NEED_ATTENTION" || rawTag === "IN_REVIEW") {
        label = "Stage 3: Under Review";
        stageNumber = 3;
        tagId = "IN_REVIEW";
        showWeight = true;
    } else if (weight === 25 || rawTag === "IN_PROGRESS") {
        label = "Stage 2: In Progress";
        stageNumber = 2;
        tagId = "IN_PROGRESS";
        showWeight = true;
    }

    return { label, stageNumber, weight, isSystem, tagId, showWeight };
}

/**
 * Checks whether a column is a protected system workflow column
 */
export function isSystemColumn(column: any): boolean {
    if (!column) return false;
    if (column.type === "SYSTEM") return true;
    if (["col-todo", "col-progress", "col-review", "col-done"].includes(column.id)) return true;
    return false;
}

/**
 * Calculates fine-grained progress percentage (0 - 100%) for a main task
 */
export function calculateTaskProgress(task: any, columnMap: Record<string, any> = {}): number {
    if (!task) return 0;

    const subtasks = task.subtasks || [];
    if (subtasks.length > 0) {
        let totalWeight = 0;
        subtasks.forEach((st: any) => {
            if (st.isCompleted) {
                totalWeight += 100;
            } else {
                const col = st.columnId ? columnMap[st.columnId] : null;
                totalWeight += getStageWeight(col || st.status);
            }
        });
        return Math.round(totalWeight / subtasks.length);
    }

    // Single task without subtasks
    if (task.isCompleted) return 100;
    const taskCol = task.columnId ? columnMap[task.columnId] : (task.column || null);
    return getStageWeight(taskCol || task.status);
}

/**
 * Calculates fine-grained cumulative progress (0 - 100%) for a project
 */
export function calculateProjectProgress(tasks: any[] = [], columns: any[] = []): number {
    if (!tasks || tasks.length === 0) return 0;

    const columnMap: Record<string, any> = {};
    if (Array.isArray(columns)) {
        columns.forEach((c) => {
            if (c?.id) columnMap[c.id] = c;
        });
    }

    let sum = 0;
    tasks.forEach((t) => {
        sum += calculateTaskProgress(t, columnMap);
    });

    return Math.round(sum / tasks.length);
}

export type ProjectHealthStatusKey = "ARCHIVED" | "COMPLETED" | "AT_RISK" | "ON_TRACK" | "ACTIVE";

export interface ProjectHealthResult {
    status: ProjectHealthStatusKey;
    label: "Archived" | "Completed" | "At Risk" | "On Track" | "Active";
    color: string;
    bg: string;
    border: string;
    dot: string;
    description: string;
}

/**
 * Automatically computes live project health and status based on:
 * - Archive state
 * - Total vs Completed tasks & progress percentage
 * - Target end dates & SLA overdue status
 * - Schedule pacing relative to timeline duration
 */
export function calculateProjectHealth(project: any): ProjectHealthResult {
    if (!project) {
        return {
            status: "ACTIVE",
            label: "Active",
            color: "text-[var(--status-active,#0284C7)]",
            bg: "bg-[var(--status-active,#0284C7)]/10",
            border: "border-[var(--status-active,#0284C7)]/20",
            dot: "bg-[var(--status-active,#0284C7)]",
            description: "Active project",
        };
    }

    // 1. Explicitly Archived
    const isArchived = project.isArchived || (project.status && String(project.status).toUpperCase() === "ARCHIVED");
    if (isArchived) {
        return {
            status: "ARCHIVED",
            label: "Archived",
            color: "text-[var(--status-archived,#6B7280)]",
            bg: "bg-[var(--status-archived,#6B7280)]/10",
            border: "border-[var(--status-archived,#6B7280)]/20",
            dot: "bg-[var(--status-archived,#6B7280)]",
            description: "Project is archived",
        };
    }

    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const totalTasks = project.totalTasks !== undefined ? project.totalTasks : tasks.length;
    const doneTasks = project.doneTasks !== undefined
        ? project.doneTasks
        : (project.completedTasks !== undefined ? project.completedTasks : tasks.filter((t: any) => t.column?.isComplete || t.isCompleted || (t.status || "").toLowerCase() === "completed" || (t.status || "").toLowerCase() === "done").length);

    const progress = Array.isArray(project.tasks) && project.tasks.length > 0
        ? calculateProjectProgress(project.tasks, project.columns)
        : (project.progress !== undefined ? project.progress : (totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0));

    // 2. Completed: All tasks are done, progress is 100%, or explicitly set to completed
    if ((totalTasks > 0 && doneTasks >= totalTasks) || progress >= 100 || (project.status && String(project.status).toUpperCase() === "COMPLETED")) {
        return {
            status: "COMPLETED",
            label: "Completed",
            color: "text-[var(--status-completed,#15803D)]",
            bg: "bg-[var(--status-completed,#15803D)]/10",
            border: "border-[var(--status-completed,#15803D)]/20",
            dot: "bg-[var(--status-completed,#15803D)]",
            description: "All milestones and tasks completed (100%)",
        };
    }

    // 3. Check Overdue & Risk Conditions
    const remainingDays = calculateRemainingDays(project.endDate);
    const hasOverdueTasks = (project.overdueTasks !== undefined ? project.overdueTasks > 0 : false) ||
        tasks.some((t: any) => {
            if (t.column?.isComplete || t.isCompleted) return false;
            if (t.riskLevel === "OVERDUE" || t.riskLevel === "CRITICAL_SLA" || t.riskLevel === "Overdue" || t.riskLevel === "CriticalSLA") return true;
            if (t.dueDate) {
                const rem = calculateRemainingDays(t.dueDate);
                if (rem && rem.isOverdue) return true;
            }
            return false;
        });

    const isProjectDeadlineOverdue = remainingDays ? remainingDays.isOverdue : false;

    // Check if timeline schedule is severely behind (e.g. >70% duration elapsed, but <25% progress)
    let isScheduleDelayed = false;
    if (project.startDate && project.endDate) {
        const totalDuration = calculateDaySpan(project.startDate, project.endDate);
        const elapsedDays = calculateDaySpan(project.startDate, new Date());
        if (totalDuration > 1 && elapsedDays > 0) {
            const timeElapsedRatio = Math.min(1, elapsedDays / totalDuration);
            if (timeElapsedRatio >= 0.7 && progress < 25) {
                isScheduleDelayed = true;
            }
        }
    }

    if (isProjectDeadlineOverdue || hasOverdueTasks || isScheduleDelayed) {
        return {
            status: "AT_RISK",
            label: "At Risk",
            color: isProjectDeadlineOverdue ? "text-[var(--color-error)]" : "text-[var(--status-at-risk,#D97706)]",
            bg: isProjectDeadlineOverdue ? "bg-[var(--color-error)]/10" : "bg-[var(--status-at-risk,#D97706)]/10",
            border: isProjectDeadlineOverdue ? "border-[var(--color-error)]/20" : "border-[var(--status-at-risk,#D97706)]/20",
            dot: isProjectDeadlineOverdue ? "bg-[var(--color-error)]" : "bg-[var(--status-at-risk,#D97706)]",
            description: isProjectDeadlineOverdue
                ? "Project deadline passed"
                : (hasOverdueTasks ? "Contains overdue tasks" : "Schedule delayed relative to target timeline"),
        };
    }

    // 4. On Track: Progress is actively advancing within timeline schedule
    if (progress > 0) {
        return {
            status: "ON_TRACK",
            label: "On Track",
            color: "text-[var(--status-on-track,#16A34A)]",
            bg: "bg-[var(--status-on-track,#16A34A)]/10",
            border: "border-[var(--status-on-track,#16A34A)]/20",
            dot: "bg-[var(--status-on-track,#16A34A)]",
            description: `On schedule with ${progress}% completion`,
        };
    }

    // 5. Active: Default active state for freshly created/active backlog projects
    return {
        status: "ACTIVE",
        label: "Active",
        color: "text-[var(--status-active,#0284C7)]",
        bg: "bg-[var(--status-active,#0284C7)]/10",
        border: "border-[var(--status-active,#0284C7)]/20",
        dot: "bg-[var(--status-active,#0284C7)]",
        description: "Active project in progress",
    };
}
