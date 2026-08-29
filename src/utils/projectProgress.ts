/**
 * Project and Task Fine-Grained Progress Engine
 * 
 * 4-Stage Workflow Progression:
 * 1. To Do (0%)
 * 2. In Progress (25%)
 * 3. Under Review (75%)
 * 4. Completed (100%)
 */

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
export function getStageMeta(column: any): { label: string; stageNumber: number; weight: number; isSystem: boolean } {
    const weight = getStageWeight(column);
    const isSystem = column?.type === "SYSTEM" || ["col-todo", "col-progress", "col-review", "col-done"].includes(column?.id);

    let label = "Stage 1: To Do";
    let stageNumber = 1;

    if (weight === 100) {
        label = "Stage 4: Completed";
        stageNumber = 4;
    } else if (weight === 75) {
        label = "Stage 3: Under Review";
        stageNumber = 3;
    } else if (weight === 25) {
        label = "Stage 2: In Progress";
        stageNumber = 2;
    }

    return { label, stageNumber, weight, isSystem };
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
