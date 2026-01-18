import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task } from '../lib/db';
import { startOfDay, endOfDay } from 'date-fns';

// =================================================================
// TASK HOOKS
// =================================================================

/**
 * Get all tasks for a specific date (reactive)
 */
export function useTasksForDate(date: Date): Task[] {
    const tasks = useLiveQuery(async () => {
        const start = startOfDay(date).getTime();
        const end = endOfDay(date).getTime();

        return db.tasks
            .where('dueDate')
            .between(start, end, true, true)
            .sortBy('order');
    }, [date.getTime()]);

    return tasks ?? [];
}

/**
 * Get all tasks in a date range (reactive)
 */
export function useTasksInRange(startDate: Date, endDate: Date): Task[] {
    const tasks = useLiveQuery(async () => {
        return db.tasks
            .where('dueDate')
            .between(startDate.getTime(), endDate.getTime(), true, true)
            .toArray();
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
 * Get count of tasks for a date (for load visualization)
 */
export function useTaskCountForDate(date: Date): number {
    const count = useLiveQuery(async () => {
        const start = startOfDay(date).getTime();
        const end = endOfDay(date).getTime();

        return db.tasks
            .where('dueDate')
            .between(start, end, true, true)
            .count();
    }, [date.getTime()]);

    return count ?? 0;
}

/**
 * Get upcoming tasks for the next N days, grouped by date
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

        // Fetch tasks for entire range
        const endDate = dates[dates.length - 1];
        const allTasks = await db.tasks
            .where('dueDate')
            .between(
                startOfDay(dates[0]).getTime(),
                endOfDay(endDate).getTime(),
                true,
                true
            )
            .toArray();

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
