import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../lib/db';
import { startOfDay, endOfDay } from 'date-fns';
import { generateRecurringInstances } from '../lib/db/recurrence';

// =================================================================
// TASK HOOKS WITH RECURRING INSTANCE SUPPORT
// =================================================================

/**
 * Get all recurring task templates (tasks with recurrence defined)
 */
async function getRecurringTemplates(): Promise<Task[]> {
    const allTasks = await db.tasks.toArray();
    return allTasks.filter(t => t.recurrence && !t.isRecurringInstance);
}

/**
 * Check if a recurring instance has been completed (persisted)
 */
async function getCompletedInstanceIds(): Promise<Set<string>> {
    // Use filter instead of indexed query since isRecurringInstance isn't indexed
    const allTasks = await db.tasks.toArray();
    const completedInstances = allTasks.filter(
        t => t.isRecurringInstance && t.completed
    );

    return new Set(completedInstances.map(t => t.id));
}

/**
 * Generate virtual instances for a date range and merge with persisted data
 */
async function getTasksWithRecurrence(
    date: Date,
    rangeStart?: Date,
    rangeEnd?: Date
): Promise<Task[]> {
    const start = rangeStart ? startOfDay(rangeStart) : startOfDay(date);
    const end = rangeEnd ? endOfDay(rangeEnd) : endOfDay(date);

    // Get persisted tasks in range
    const persistedTasks = await db.tasks
        .where('dueDate')
        .between(start.getTime(), end.getTime(), true, true)
        .toArray();

    // Get recurring templates
    const templates = await getRecurringTemplates();

    // Generate virtual instances for each template
    const virtualInstances: Task[] = [];
    for (const template of templates) {
        const instances = generateRecurringInstances(template, start, end);
        virtualInstances.push(...instances);
    }

    // Check for already-completed instances (persisted separately)
    const completedIds = await getCompletedInstanceIds();

    // Filter out virtual instances that have a persisted version
    const persistedIds = new Set(persistedTasks.map(t => t.id));
    const filteredVirtual = virtualInstances.filter(v => {
        // Don't add if already persisted (completed or otherwise)
        if (persistedIds.has(v.id)) return false;
        // Don't add if marked as completed
        if (completedIds.has(v.id)) return false;
        return true;
    });

    // Merge: persisted tasks + filtered virtual instances
    // Also include the template on its original date
    const result = [...persistedTasks, ...filteredVirtual];

    return result;
}

/**
 * Get all tasks for a specific date (reactive) - includes recurring instances
 */
export function useTasksForDate(date: Date): Task[] {
    const tasks = useLiveQuery(async () => {
        const allTasks = await getTasksWithRecurrence(date);

        // Filter to only this specific date and sort
        const dayStart = startOfDay(date).getTime();
        const dayEnd = endOfDay(date).getTime();

        return allTasks
            .filter(t => t.dueDate >= dayStart && t.dueDate <= dayEnd)
            .sort((a, b) => a.order - b.order);
    }, [date.getTime()]);

    return tasks ?? [];
}

/**
 * Get all tasks in a date range (reactive) - includes recurring instances
 */
export function useTasksInRange(startDate: Date, endDate: Date): Task[] {
    const tasks = useLiveQuery(async () => {
        return getTasksWithRecurrence(startDate, startDate, endDate);
    }, [startDate.getTime(), endDate.getTime()]);

    return tasks ?? [];
}

/**
 * Get a single task by ID (reactive)
 */
export function useTask(taskId: string | null): Task | undefined {
    const task = useLiveQuery(async () => {
        if (!taskId) return undefined;
        return db.tasks.get(taskId);
    }, [taskId]);

    return task;
}

/**
 * Get count of tasks for a date (for load visualization) - includes recurring
 */
export function useTaskCountForDate(date: Date): number {
    const count = useLiveQuery(async () => {
        const tasks = await getTasksWithRecurrence(date);
        const dayStart = startOfDay(date).getTime();
        const dayEnd = endOfDay(date).getTime();

        return tasks.filter(t =>
            t.dueDate >= dayStart &&
            t.dueDate <= dayEnd &&
            !t.completed
        ).length;
    }, [date.getTime()]);

    return count ?? 0;
}

/**
 * Get upcoming tasks for the next N days, grouped by date - includes recurring
 */
export function useUpcomingTasks(days: number = 7): { date: Date; tasks: Task[] }[] {
    const result = useLiveQuery(async () => {
        const today = new Date();
        const start = startOfDay(today);

        // Build array of dates starting from tomorrow
        const dates: Date[] = [];
        for (let i = 1; i <= days; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }

        // Fetch all tasks including recurring for entire range
        const endDate = dates[dates.length - 1];
        const allTasks = await getTasksWithRecurrence(dates[0], dates[0], endDate);

        // Group by date
        return dates.map(date => {
            const dayStart = startOfDay(date).getTime();
            const dayEnd = endOfDay(date).getTime();
            const tasks = allTasks.filter(
                t => t.dueDate >= dayStart && t.dueDate <= dayEnd && !t.completed
            );
            return { date, tasks };
        }).filter(group => group.tasks.length > 0);
    }, [days]);

    return result ?? [];
}
