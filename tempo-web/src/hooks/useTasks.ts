import { useQuery } from '@powersync/react';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';
import { generateRecurringInstances } from '../lib/db/recurrence';
import { type Task, rowToTask } from '../lib/db';
import { useMemo } from 'react';


// =================================================================
// RECURRENCE MERGE LOGIC
// =================================================================

function mergeTasksWithRecurrence(
    rangeTasks: Task[],
    templates: Task[],
    completedInstanceIds: Set<string>,
    start: Date,
    end: Date
): Task[] {
    // Generate virtual instances for each template
    const virtualInstances: Task[] = [];
    for (const template of templates) {
        const instances = generateRecurringInstances(template, start, end);
        virtualInstances.push(...instances);
    }

    // Filter out virtual instances that have a persisted version (completed or exception)
    const persistedIds = new Set(rangeTasks.map(t => t.id));

    const filteredVirtual = virtualInstances.filter(v => {
        // Don't add if already persisted (completed or otherwise)
        if (persistedIds.has(v.id)) return false;
        // Don't add if marked as completed (and tracked in completed_ids set)
        if (completedInstanceIds.has(v.id)) return false;
        return true;
    });

    return [...rangeTasks, ...filteredVirtual];
}


// =================================================================
// REACTIVE HOOKS
// =================================================================

/**
 * Get all tasks for a specific date (reactive) - includes recurring instances
 */
export function useTasksForDate(date: Date): Task[] {
    // Use YYYY-MM-DD format for timezone-agnostic queries
    const dateStr = format(date, 'yyyy-MM-dd');
    // Keep timestamps for recurrence calculations
    const dayStart = startOfDay(date).getTime();
    const dayEnd = endOfDay(date).getTime();

    // 1. Get standard tasks for the day using date string
    const { data: rangeRows } = useQuery(
        `SELECT * FROM tasks WHERE due_date_local = ?`,
        [dateStr]
    );

    // 2. Get recurring templates (to generate virtuals)
    const { data: templateRows } = useQuery(
        `SELECT * FROM tasks WHERE recurrence IS NOT NULL`
    );

    // 3. Get completed instance IDs (to exclude virtuals that are done)
    // Note: We need completed instances that might NOT be in the range query if they are virtuals persisted?
    // Actually, persisted virtuals ARE in rangeRows if they have due_date in range.
    // The only edge case is if we track completion in a separate table, but currently we insert them into 'tasks'.
    // So rangeRows covers completed instances for this day.
    // We only need global completed check if we stored completions separately.
    // Since persisted instances are in 'tasks', we are good.

    const tasks = useMemo(() => {
        // Optimization: Quick return if no data
        const rows = rangeRows || [];
        const templates = templateRows || [];
        if (rows.length === 0 && templates.length === 0) return [];

        const rangeTasks = rows.map(rowToTask);
        const templateTasks = templates.map(rowToTask);

        // Filter templates: exclude generated instances from templates list if any leak in
        // AND pre-filter templates that definitely don't overlap with the day
        const dayStartInstance = new Date(dayStart);
        const dayEndInstance = new Date(dayEnd);

        const cleanTemplates = templateTasks.filter(t => {
            if (t.isRecurringInstance) return false;
            // Creation date check (start date)
            if (t.dueDate > dayEnd) return false;
            // Recurrence end date check
            if (t.recurrence?.endDate && t.recurrence.endDate < dayStart) return false;
            return true;
        });

        const merged = mergeTasksWithRecurrence(
            rangeTasks,
            cleanTemplates,
            new Set(), // Persisted instances already in rangeTasks
            dayStartInstance,
            dayEndInstance
        );

        return merged.sort((a, b) => a.order - b.order);
    }, [rangeRows, templateRows, dayStart, dayEnd]);

    return tasks;
}

/**
 * Get all tasks in a date range (reactive)
 */
export function useTasksInRange(startDate: Date, endDate: Date): Task[] {
    // Use YYYY-MM-DD format for timezone-agnostic queries
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    // Keep timestamps for recurrence calculations
    const startTs = startDate.getTime();
    const endTs = endDate.getTime();

    const { data: rangeRows } = useQuery(
        `SELECT * FROM tasks WHERE due_date_local BETWEEN ? AND ?`,
        [startStr, endStr]
    );

    const { data: templateRows } = useQuery(
        `SELECT * FROM tasks WHERE recurrence IS NOT NULL`
    );

    const tasks = useMemo(() => {
        // Optimization: Quick return
        const rows = rangeRows || [];
        const templates = templateRows || [];
        if (rows.length === 0 && templates.length === 0) return [];

        const rangeTasks = rows.map(rowToTask);

        // Date objects for range
        const rangeStartDate = new Date(startTs);
        const rangeEndDate = new Date(endTs);

        const cleanTemplates = templates.map(rowToTask).filter(t => {
            if (t.isRecurringInstance) return false;
            // Creation date check
            if (t.dueDate > endTs) return false;
            // Recurrence end date check
            if (t.recurrence?.endDate && t.recurrence.endDate < startTs) return false;
            return true;
        });

        return mergeTasksWithRecurrence(
            rangeTasks,
            cleanTemplates,
            new Set(),
            rangeStartDate,
            rangeEndDate
        );
    }, [rangeRows, templateRows, startTs, endTs]);

    return tasks;
}

/**
 * Get a single task by ID (reactive)
 */
export function useTask(taskId: string | null): Task | undefined {
    const { data } = useQuery(
        `SELECT * FROM tasks WHERE id = ?`,
        taskId ? [taskId] : []
    );

    const task = useMemo(() => {
        if (!data || data.length === 0) return undefined;
        return rowToTask(data[0]);
    }, [data]);

    return task;
}

/**
 * Get count of tasks for a date
 */
export function useTaskCountForDate(date: Date): number {
    // We can reuse useTasksForDate logic or optimize.
    // Reusing is safer for consistency.
    const tasks = useTasksForDate(date);
    return tasks.filter(t => !t.completed).length;
}

/**
 * Get upcoming tasks for the next N days
 */
export function useUpcomingTasks(days: number = 7): { date: Date; tasks: Task[] }[] {
    const { rangeStart, rangeEnd } = useMemo(() => {
        const start = startOfDay(new Date());
        return { rangeStart: addDays(start, 1), rangeEnd: addDays(start, days) };
    }, [days]);

    const tasksInRange = useTasksInRange(rangeStart, rangeEnd);

    const result = useMemo(() => {
        const groups: { date: Date; tasks: Task[] }[] = [];

        // Group by day
        for (let i = 0; i < days; i++) {
            const date = addDays(rangeStart, i);
            const dayStart = startOfDay(date).getTime();
            const dayEnd = endOfDay(date).getTime();

            const daysTasks = tasksInRange.filter(
                t => t.dueDate >= dayStart && t.dueDate <= dayEnd && !t.completed
            );

            if (daysTasks.length > 0) {
                groups.push({ date, tasks: daysTasks });
            }
        }
        return groups;
    }, [tasksInRange, rangeStart, days]);

    return result;
}
