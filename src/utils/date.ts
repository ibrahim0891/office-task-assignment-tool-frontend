/**
 * Utility functions for timezone-consistent date handling.
 * Avoids toISOString() timezone offsets which cause date flipping.
 */

/**
 * Returns a date formatted as "YYYY-MM-DD" using the local system/browser time.
 */
export function getLocalDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Safely parses a "YYYY-MM-DD" string into a Date object at local noon
 * to avoid daylight saving and timezone edge case day-flips.
 */
export function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Extracts "YYYY-MM-DD" from any Date, ISO string, or date string.
 */
export function extractDateString(dateVal?: string | Date | null): string {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
        return dateVal.split("T")[0];
    }
    return getLocalDateString(dateVal);
}

/**
 * Calculates the day count between start date and end date (inclusive).
 * E.g., same day = 1 day, Aug 1 to Aug 5 = 5 days.
 * Returns 1 if dates are missing, invalid, or startDate > endDate.
 */
export function calculateDaySpan(
    startDateVal?: string | Date | null,
    endDateVal?: string | Date | null
): number {
    if (!startDateVal || !endDateVal) return 1;
    const startStr = extractDateString(startDateVal);
    const endStr = extractDateString(endDateVal);
    if (!startStr || !endStr) return 1;

    const start = parseLocalDate(startStr);
    const end = parseLocalDate(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;

    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 1;

    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays + 1;
}

/**
 * Formats day count with singular/plural unit (e.g., '1 day', '5 days').
 */
export function formatDaySpan(days: number): string {
    const d = Math.max(1, Math.round(days));
    return d === 1 ? "1 day" : `${d} days`;
}

/**
 * Calculates actual days from creation date to completion date.
 * E.g., created Aug 1, completed Aug 3 = 3 days.
 * If not completed, returns 0.
 */
export function calculateActualDays(
    createdAtVal?: string | Date | null,
    completedAtVal?: string | Date | null,
    isCompleted: boolean = true
): number {
    if (!isCompleted || !createdAtVal) return 0;
    const completionDate = completedAtVal || new Date();
    return calculateDaySpan(createdAtVal, completionDate);
}

