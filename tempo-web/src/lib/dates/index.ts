import {
    startOfDay,
    addDays,
    subDays,
    format,
    isToday,
    isSameDay,
    differenceInDays
} from 'date-fns';

// =================================================================
// DATE UTILITIES FOR TIMELINE
// =================================================================

/**
 * Get the start of day for a given date
 */
export function getDayStart(date: Date): Date {
    return startOfDay(date);
}

/**
 * Get an array of dates for a range
 */
export function getDateRange(centerDate: Date, daysBefore: number, daysAfter: number): Date[] {
    const dates: Date[] = [];
    const start = subDays(startOfDay(centerDate), daysBefore);

    for (let i = 0; i <= daysBefore + daysAfter; i++) {
        dates.push(addDays(start, i));
    }

    return dates;
}

/**
 * Format a date for display
 */
export function formatDayHeader(date: Date): string {
    if (isToday(date)) {
        return 'Today';
    }
    return format(date, 'EEEE, MMMM d');
}

/**
 * Format date for secondary display
 */
export function formatDaySubheader(date: Date): string {
    return format(date, 'yyyy');
}

/**
 * Check if two dates are the same day
 */
export function areSameDay(date1: Date, date2: Date): boolean {
    return isSameDay(date1, date2);
}

/**
 * Get the index offset for a date relative to a center date
 */
export function getDateOffset(date: Date, centerDate: Date): number {
    return differenceInDays(date, centerDate);
}

/**
 * Convert a day index (where 0 = center) to a date
 */
export function indexToDate(index: number, centerDate: Date): Date {
    return addDays(startOfDay(centerDate), index);
}

/**
 * Convert a date to an index (where 0 = center)
 */
export function dateToIndex(date: Date, centerDate: Date): number {
    return differenceInDays(startOfDay(date), startOfDay(centerDate));
}
