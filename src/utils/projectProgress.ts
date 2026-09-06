/**
 * Project and Task Fine-Grained Progress Engine
 * 
 * 4-Stage Workflow Progression:
 * 1. To Do (0%)
 * 2. In Progress (25%)
 * 3. Under Review (75%)
 * 4. Completed (100%)
 */

export const STAGE_TAG_OPTIONS = [
    {
        id: "TODO",
        label: "To Do / Backlog",
        shortLabel: "To Do",
        weight: 0,
        color: "text-[var(--status-todo,#6B7280)]",
        bg: "bg-[var(--status-todo,#6B7280)]/10",
        border: "border-[var(--status-todo,#6B7280)]/30",
        dot: "bg-[var(--status-todo,#6B7280)]",
        description: "Initial unstarted queue (0% progress)"
    },
    {
        id: "IN_PROGRESS",
        label: "In Progress / Active",
        shortLabel: "In Progress",
        weight: 25,
        color: "text-[var(--status-in-progress,#7C3AED)]",
        bg: "bg-[var(--status-in-progress,#7C3AED)]/10",
        border: "border-[var(--status-in-progress,#7C3AED)]/30",
        dot: "bg-[var(--status-in-progress,#7C3AED)]",
        description: "Active development or execution (25% progress)"
    },
    {
        id: "IN_REVIEW",
        label: "In Review / Testing",
        shortLabel: "In Review",
        weight: 75,
        color: "text-[var(--status-at-risk,#D97706)]",
        bg: "bg-[var(--status-at-risk,#D97706)]/10",
        border: "border-[var(--status-at-risk,#D97706)]/30",
        dot: "bg-[var(--status-at-risk,#D97706)]",
        description: "QA verification, review, or testing (75% progress)"
    },
    {
        id: "DONE",
        label: "Done / Completed",
        shortLabel: "Done",
        weight: 100,
        color: "text-[var(--status-completed,#15803D)]",
        bg: "bg-[var(--status-completed,#15803D)]/10",
        border: "border-[var(--status-completed,#15803D)]/30",
        dot: "bg-[var(--status-completed,#15803D)]",
        description: "Finished and deployed milestone (100% progress)"
    },
] as const;

export const STAGE_PROGRESS_WEIGHTS: Record<string, number> = {
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
    if (typeOrTag === "DONE" || typeOrTag === "COMPLETED") return 100;
    if (typeOrTag === "IN_REVIEW" || typeOrTag === "REVIEW") return 75;
    if (typeOrTag === "IN_PROGRESS" || typeOrTag === "PROGRESS") return 25;
    if (typeOrTag === "TODO" || typeOrTag === "TO_DO") return 0;

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
export function getStageMeta(column: any): { label: string; stageNumber: number; weight: number; isSystem: boolean; tagId: string } {
    const weight = getStageWeight(column);
    const isSystem = column?.type === "SYSTEM" || ["col-todo", "col-progress", "col-review", "col-done"].includes(column?.id);

    let label = "Stage 1: To Do";
    let stageNumber = 1;
    let tagId = "TODO";

    if (weight === 100) {
        label = "Stage 4: Completed";
        stageNumber = 4;
        tagId = "DONE";
    } else if (weight === 75) {
        label = "Stage 3: Under Review";
        stageNumber = 3;
        tagId = "IN_REVIEW";
    } else if (weight === 25) {
        label = "Stage 2: In Progress";
        stageNumber = 2;
        tagId = "IN_PROGRESS";
    }

    return { label, stageNumber, weight, isSystem, tagId };
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
