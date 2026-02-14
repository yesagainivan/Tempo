import { useMemo } from 'react';
import { type Task, rowToTask } from '../lib/db';
import { useTaskData } from './useTaskContext'; // Actions no longer needed for window
import { format, startOfDay, addDays } from 'date-fns';
import { useQuery } from '@powersync/react';

// =================================================================
// CONSUMER HOOKS (Optimized)
// =================================================================

/**
 * Get all tasks for a specific date (from Cache)
 */
export function useTasksForDate(date: Date): Task[] {
    const { tasksMap } = useTaskData();
    // Window management is now handled by App.tsx, so we just read what's available.

    // If date is outside window, tasks will be empty array.
    // The App's "Selected Date" state should drive the window update.

    const dateKey = format(date, 'yyyy-MM-dd');
    const tasks = tasksMap.get(dateKey) || [];

    return tasks;
}

/**
 * Get all tasks in a date range (from Cache + Filter)
 */
export function useTasksInRange(startDate: Date, endDate: Date): Task[] {
    const { tasksMap } = useTaskData();

    // Efficiently gather tasks from the map for the range
    const tasks = useMemo(() => {
        const result: Task[] = [];
        // Iterate days in range
        const current = new Date(startDate);

        while (current <= endDate) {
            const key = format(current, 'yyyy-MM-dd');
            const daysTasks = tasksMap.get(key);
            if (daysTasks) {
                result.push(...daysTasks);
            }
            current.setDate(current.getDate() + 1);
        }
        return result;
    }, [startDate, endDate, tasksMap]);

    return tasks;
}

/**
 * Get a single task by ID (Cache First -> Fallback to DB)
 */
export function useTask(taskId: string | null): Task | undefined {
    const { taskIdMap } = useTaskData();

    // 1. Try FAST In-Memory Cache (O(1))
    // This covers all tasks currently within the active window (e.g., this month)
    const cachedTask = useMemo(() => {
        if (!taskId) return undefined;
        return taskIdMap.get(taskId);
    }, [taskId, taskIdMap]);

    // 2. Fallback: Direct Database Query
    // Only fetch if we have an ID but it wasn't found in the map (e.g. from a deep link outside the window)
    const shouldFetch = !!taskId && !cachedTask;

    const { data } = useQuery(
        `SELECT * FROM tasks WHERE id = ?`,
        shouldFetch ? [taskId] : []
    );

    const fallbackTask = useMemo(() => {
        if (!data || data.length === 0) return undefined;
        return rowToTask(data[0]);
    }, [data]);

    return cachedTask || fallbackTask;
}

/**
 * Get count of tasks for a date
 */
export function useTaskCountForDate(date: Date): number {
    const tasks = useTasksForDate(date);
    return tasks.filter(t => !t.completed).length;
}

/**
 * Get upcoming tasks for the next N days
 */
export function useUpcomingTasks(days: number = 7): { date: Date; tasks: Task[] }[] {
    // Stable reference for "today" to prevent re-renders on every second
    const today = useMemo(() => startOfDay(new Date()), []);
    const rangeStart = useMemo(() => addDays(today, 1), [today]);
    const rangeEnd = useMemo(() => addDays(today, days), [today, days]);

    const tasksInRange = useTasksInRange(rangeStart, rangeEnd);

    // Grouping
    const result = useMemo(() => {
        const groups: { date: Date; tasks: Task[] }[] = [];
        // Helper map for grouping the linear list back to dates
        const byDate = new Map<string, Task[]>();

        for (const t of tasksInRange) {
            const k = t.dueDateLocal;
            if (!byDate.has(k)) byDate.set(k, []);
            byDate.get(k)?.push(t);
        }

        for (let i = 0; i < days; i++) {
            const date = addDays(rangeStart, i);
            const key = format(date, 'yyyy-MM-dd');
            const dayTasks = byDate.get(key) || [];

            if (dayTasks.length > 0) {
                // Filter out completed if desired, though generic getter usually returns all
                const pending = dayTasks.filter(t => !t.completed);
                if (pending.length > 0) {
                    groups.push({ date, tasks: pending });
                }
            }
        }
        return groups;
    }, [tasksInRange, rangeStart, days]);

    return result;
}
