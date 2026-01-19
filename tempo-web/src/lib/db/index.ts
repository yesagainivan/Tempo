import Dexie, { type EntityTable } from 'dexie';

// =================================================================
// TYPE DEFINITIONS
// =================================================================

export type TaskType = 'quick' | 'deep';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Recurrence {
    pattern: RecurrencePattern;
    interval: number;              // every N days/weeks/months/years
    daysOfWeek?: number[];         // 0-6 for weekly (0=Sunday)
    endDate?: number;              // optional end timestamp
    occurrences?: number;          // optional max occurrences
}

export interface Task {
    id: string;
    title: string;
    type: TaskType;
    content: string; // Markdown content for deep tasks, empty for quick
    dueDate: number; // Unix timestamp
    completed: boolean;
    completedAt?: number;
    createdAt: number;
    updatedAt: number;
    order: number; // For manual sorting within a day

    // Recurring task fields
    recurrence?: Recurrence;       // recurrence pattern (only on templates)
    recurringParentId?: string;    // links instance to template
    isRecurringInstance?: boolean; // true for generated instances
}

// =================================================================
// DATABASE INSTANCE
// =================================================================

class TempoDatabase extends Dexie {
    tasks!: EntityTable<Task, 'id'>;

    constructor() {
        super('tempo');

        // v1: Initial schema
        this.version(1).stores({
            tasks: 'id, dueDate, completed, createdAt, type, [dueDate+order]',
        });

        // v2: Add recurring task support
        this.version(2).stores({
            tasks: 'id, dueDate, completed, createdAt, type, [dueDate+order], recurringParentId',
        });
    }
}

export const db = new TempoDatabase();

// =================================================================
// HELPER FUNCTIONS
// =================================================================

export function generateId(): string {
    return crypto.randomUUID();
}

export function createQuickTask(title: string, dueDate: Date): Omit<Task, 'id'> {
    const now = Date.now();
    return {
        title,
        type: 'quick',
        content: '',
        dueDate: dueDate.getTime(),
        completed: false,
        createdAt: now,
        updatedAt: now,
        order: now, // Use timestamp for initial ordering
    };
}

export function createDeepTask(title: string, dueDate: Date, content = ''): Omit<Task, 'id'> {
    const now = Date.now();
    return {
        title,
        type: 'deep',
        content,
        dueDate: dueDate.getTime(),
        completed: false,
        createdAt: now,
        updatedAt: now,
        order: now,
    };
}

// =================================================================
// QUERY HELPERS
// =================================================================

/**
 * Get all tasks for a specific date
 */
export async function getTasksForDate(date: Date): Promise<Task[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.tasks
        .where('dueDate')
        .between(startOfDay.getTime(), endOfDay.getTime(), true, true)
        .sortBy('order');
}

/**
 * Get tasks in a date range (for timeline rendering)
 */
export async function getTasksInRange(startDate: Date, endDate: Date): Promise<Task[]> {
    return db.tasks
        .where('dueDate')
        .between(startDate.getTime(), endDate.getTime(), true, true)
        .toArray();
}

/**
 * Toggle task completion
 */
export async function toggleTaskComplete(taskId: string): Promise<void> {
    const task = await db.tasks.get(taskId);

    if (task) {
        // Task exists in DB - simple toggle
        await db.tasks.update(taskId, {
            completed: !task.completed,
            completedAt: task.completed ? undefined : Date.now(),
            updatedAt: Date.now(),
        });
    } else {
        // Virtual recurring instance - need to persist it first as completed
        // The ID format is parentId_timestamp, so we can extract parent info
        const underscoreIndex = taskId.lastIndexOf('_');
        if (underscoreIndex > 0) {
            const parentId = taskId.slice(0, underscoreIndex);
            const parent = await db.tasks.get(parentId);

            if (parent && parent.recurrence) {
                // Parse the date from the instance ID
                const dateStr = taskId.slice(underscoreIndex + 1);
                const dueDate = parseInt(dateStr, 36);

                // Create and persist the completed instance
                const instance: Task = {
                    id: taskId,
                    title: parent.title,
                    type: parent.type,
                    content: parent.content,
                    dueDate,
                    completed: true,
                    completedAt: Date.now(),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    order: parent.order,
                    recurringParentId: parentId,
                    isRecurringInstance: true,
                };

                await db.tasks.add(instance);
            }
        }
    }
}

/**
 * Update task content (for deep tasks)
 */
export async function updateTaskContent(taskId: string, content: string): Promise<void> {
    await db.tasks.update(taskId, {
        content,
        updatedAt: Date.now(),
    });
}

/**
 * Reschedule a task to a new date
 */
export async function rescheduleTask(taskId: string, newDate: Date): Promise<void> {
    await db.tasks.update(taskId, {
        dueDate: newDate.getTime(),
        updatedAt: Date.now(),
    });
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
    await db.tasks.delete(taskId);
}

/**
 * Update task fields (title, type, etc.)
 */
export async function updateTask(
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'type' | 'content' | 'recurrence'>>
): Promise<void> {
    await db.tasks.update(taskId, {
        ...updates,
        updatedAt: Date.now(),
    });
}
