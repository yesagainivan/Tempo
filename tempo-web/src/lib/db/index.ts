import Dexie, { type EntityTable } from 'dexie';

// =================================================================
// TYPE DEFINITIONS
// =================================================================

export type TaskType = 'quick' | 'deep';

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
}

// =================================================================
// DATABASE INSTANCE
// =================================================================

class TempoDatabase extends Dexie {
    tasks!: EntityTable<Task, 'id'>;

    constructor() {
        super('tempo');

        this.version(1).stores({
            // Primary key + indexed fields
            tasks: 'id, dueDate, completed, createdAt, type, [dueDate+order]',
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
        await db.tasks.update(taskId, {
            completed: !task.completed,
            completedAt: task.completed ? undefined : Date.now(),
            updatedAt: Date.now(),
        });
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
