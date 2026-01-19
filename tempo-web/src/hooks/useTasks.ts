import { useQuery } from '@powersync/react';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { generateRecurringInstances } from '../lib/db/recurrence';
import { type Task, type TaskType } from '../lib/db';
import { useMemo } from 'react';

// =================================================================
// HELPER: Row Mapper (Duplicate of db/index.ts for now logic)
// =================================================================

function rowToTask(row: any): Task {
    return {
        id: row.id,
        title: row.title,
        type: row.type as TaskType,
        content: row.content || '',
        dueDate: row.due_date,
        completed: row.completed === 1,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        order: row.order_key,
        recurrence: row.recurrence ? JSON.parse(row.recurrence) : undefined,
        recurringParentId: row.recurring_parent_id,
        isRecurringInstance: row.is_recurring_instance === 1,
    };
}

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
    const dayStart = startOfDay(date).getTime();
    const dayEnd = endOfDay(date).getTime();

    // 1. Get standard tasks for the day
    const { data: rangeRows } = useQuery(
        `SELECT * FROM tasks WHERE due_date BETWEEN ? AND ?`,
        [dayStart, dayEnd]
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
        const rangeTasks = rangeRows.map(rowToTask);
        const templates = templateRows.map(rowToTask);

        // Filter templates: exclude generated instances from templates list if any leak in
        const cleanTemplates = templates.filter(t => !t.isRecurringInstance);

        const merged = mergeTasksWithRecurrence(
            rangeTasks,
            cleanTemplates,
            new Set(), // persisted instances are already in rangeTasks, so we don't need extra set check if logic holds
            startOfDay(date),
            endOfDay(date)
        );

        return merged.sort((a, b) => a.order - b.order);
    }, [rangeRows, templateRows, date]);

    return tasks;
}

/**
 * Get all tasks in a date range (reactive)
 */
export function useTasksInRange(startDate: Date, endDate: Date): Task[] {
    const startTs = startDate.getTime();
    const endTs = endDate.getTime();

    const { data: rangeRows } = useQuery(
        `SELECT * FROM tasks WHERE due_date BETWEEN ? AND ?`,
        [startTs, endTs]
    );

    const { data: templateRows } = useQuery(
        `SELECT * FROM tasks WHERE recurrence IS NOT NULL`
    );

    const tasks = useMemo(() => {
        const rangeTasks = rangeRows.map(rowToTask);
        const templates = templateRows.map(rowToTask).filter(t => !t.isRecurringInstance);

        return mergeTasksWithRecurrence(
            rangeTasks,
            templates,
            new Set(),
            startDate,
            endDate
        );
    }, [rangeRows, templateRows, startDate, endDate]);

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
    const today = new Date();
    const start = startOfDay(today);
    // Start from tomorrow
    const rangeStart = addDays(start, 1);
    const rangeEnd = addDays(start, days);

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
