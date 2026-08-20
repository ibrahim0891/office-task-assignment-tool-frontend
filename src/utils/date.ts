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
