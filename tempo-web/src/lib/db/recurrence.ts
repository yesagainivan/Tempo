import {
    addDays,
    addWeeks,
    addMonths,
    addYears,
    startOfDay,
    getDay,
    isBefore,
    isAfter,
    isSameDay,
} from 'date-fns';
import type { Task, Recurrence, RecurrencePattern } from '../db';

// =================================================================
// RECURRENCE UTILITIES
// =================================================================

/**
 * Generate a unique ID for a recurring instance based on parent and date
 * This ensures the same instance ID is generated for the same date
 */
export function generateInstanceId(parentId: string, date: Date): string {
    const dateStr = startOfDay(date).getTime().toString(36);
    return `${parentId}_${dateStr}`;
}

/**
 * Calculate the next occurrence date from a given date
 */
export function getNextOccurrence(
    recurrence: Recurrence,
    fromDate: Date
): Date {
    const { pattern, interval, daysOfWeek } = recurrence;

    switch (pattern) {
        case 'daily':
            return addDays(fromDate, interval);

        case 'weekly':
            if (daysOfWeek && daysOfWeek.length > 0) {
                // Find next matching day of week
                return getNextMatchingDayOfWeek(fromDate, daysOfWeek, interval);
            }
            return addWeeks(fromDate, interval);

        case 'monthly':
            return addMonths(fromDate, interval);

        case 'yearly':
            return addYears(fromDate, interval);

        default:
            return addDays(fromDate, 1);
    }
}

/**
 * Find the next date that matches one of the specified days of week
 */
function getNextMatchingDayOfWeek(
    fromDate: Date,
    daysOfWeek: number[],
    weekInterval: number
): Date {
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
    const currentDay = getDay(fromDate);

    // Find next day in current week (after today)
    for (const targetDay of sortedDays) {
        if (targetDay > currentDay) {
            return addDays(fromDate, targetDay - currentDay);
        }
    }

    // Move to next week interval and get first matching day
    const nextWeekStart = addWeeks(fromDate, weekInterval);
    const startDay = getDay(nextWeekStart);
    const firstTargetDay = sortedDays[0];
    const daysToAdd = (firstTargetDay - startDay + 7) % 7;

    return addDays(nextWeekStart, daysToAdd);
}

/**
 * Check if a recurrence should generate an instance on a specific date
 */
export function shouldOccurOn(
    task: Task,
    targetDate: Date
): boolean {
    if (!task.recurrence) return false;

    const { pattern, interval, daysOfWeek, endDate } = task.recurrence;
    const startDate = new Date(task.dueDate);
    const target = startOfDay(targetDate);
    const start = startOfDay(startDate);

    // Check if before start date
    if (isBefore(target, start)) return false;

    // Check end date
    if (endDate && isAfter(target, new Date(endDate))) return false;

    // Same day as original is always valid
    if (isSameDay(target, start)) return true;

    // Must be after start date
    if (!isAfter(target, start)) return false;

    switch (pattern) {
        case 'daily':
            return isDailyMatch(start, target, interval);

        case 'weekly':
            if (daysOfWeek && daysOfWeek.length > 0) {
                return isWeeklyDaysMatch(start, target, daysOfWeek, interval);
            }
            return isWeeklyMatch(start, target, interval);

        case 'monthly':
            return isMonthlyMatch(start, target, interval);

        case 'yearly':
            return isYearlyMatch(start, target, interval);

        default:
            return false;
    }
}

function isDailyMatch(start: Date, target: Date, interval: number): boolean {
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays % interval === 0;
}

function isWeeklyMatch(start: Date, target: Date, interval: number): boolean {
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    return diffDays % 7 === 0 && diffWeeks % interval === 0;
}

function isWeeklyDaysMatch(
    start: Date,
    target: Date,
    daysOfWeek: number[],
    interval: number
): boolean {
    const targetDay = getDay(target);
    if (!daysOfWeek.includes(targetDay)) return false;

    // Check if we're in the correct week interval
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    // For weekly interval, we need to check if we're in the right week
    return interval === 1 || diffWeeks % interval === 0;
}

function isMonthlyMatch(start: Date, target: Date, interval: number): boolean {
    const startDay = start.getDate();
    const targetDay = target.getDate();

    if (startDay !== targetDay) return false;

    const monthsDiff =
        (target.getFullYear() - start.getFullYear()) * 12 +
        (target.getMonth() - start.getMonth());

    return monthsDiff >= 0 && monthsDiff % interval === 0;
}

function isYearlyMatch(start: Date, target: Date, interval: number): boolean {
    const sameMonthDay =
        start.getMonth() === target.getMonth() &&
        start.getDate() === target.getDate();

    if (!sameMonthDay) return false;

    const yearsDiff = target.getFullYear() - start.getFullYear();
    return yearsDiff >= 0 && yearsDiff % interval === 0;
}

/**
 * Generate recurring task instances for a date range
 * Returns virtual instances (not persisted) that should appear in the range
 */
export function generateRecurringInstances(
    template: Task,
    rangeStart: Date,
    rangeEnd: Date
): Task[] {
    if (!template.recurrence) return [];

    const instances: Task[] = [];
    const start = startOfDay(rangeStart);
    const end = startOfDay(rangeEnd);

    // Iterate through each day in range
    let current = new Date(start);
    while (!isAfter(current, end)) {
        if (shouldOccurOn(template, current)) {
            // Don't regenerate instance for the original date
            if (!isSameDay(current, new Date(template.dueDate))) {
                instances.push(createVirtualInstance(template, current));
            }
        }
        current = addDays(current, 1);
    }

    return instances;
}

/**
 * Create a virtual (non-persisted) recurring instance
 */
function createVirtualInstance(template: Task, date: Date): Task {
    return {
        ...template,
        id: generateInstanceId(template.id, date),
        dueDate: startOfDay(date).getTime(),
        completed: false,
        completedAt: undefined,
        recurringParentId: template.id,
        isRecurringInstance: true,
        // Remove recurrence from instances so they don't spawn more
        recurrence: undefined,
    };
}

/**
 * Format recurrence pattern for display
 */
export function formatRecurrence(recurrence: Recurrence): string {
    const { pattern, interval, daysOfWeek } = recurrence;

    if (pattern === 'daily') {
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
    }

    if (pattern === 'weekly') {
        if (daysOfWeek && daysOfWeek.length > 0) {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const days = daysOfWeek.map(d => dayNames[d]).join(', ');
            return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
        }
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
    }

    if (pattern === 'monthly') {
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
    }

    if (pattern === 'yearly') {
        return interval === 1 ? 'Yearly' : `Every ${interval} years`;
    }

    return 'Repeating';
}

/**
 * Parse a simple recurrence pattern from UI selection
 */
export function createRecurrence(
    pattern: RecurrencePattern,
    interval: number = 1,
    daysOfWeek?: number[],
    endDate?: Date
): Recurrence {
    return {
        pattern,
        interval,
        daysOfWeek: pattern === 'weekly' ? daysOfWeek : undefined,
        endDate: endDate?.getTime(),
    };
}
