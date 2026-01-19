import { db } from './powersync';
export { db } from './powersync';

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
// HELPERS: MAPPERS
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

function taskToRow(task: Partial<Task>): any {
    const row: any = {};
    if (task.id !== undefined) row.id = task.id;
    if (task.title !== undefined) row.title = task.title;
    if (task.type !== undefined) row.type = task.type;
    if (task.content !== undefined) row.content = task.content;
    if (task.dueDate !== undefined) row.due_date = task.dueDate;
    if (task.completed !== undefined) row.completed = task.completed ? 1 : 0;
    if (task.completedAt !== undefined) row.completed_at = task.completedAt;
    if (task.createdAt !== undefined) row.created_at = task.createdAt;
    if (task.updatedAt !== undefined) row.updated_at = task.updatedAt;
    if (task.order !== undefined) row.order_key = task.order;
    if (task.recurrence !== undefined) row.recurrence = JSON.stringify(task.recurrence);
    if (task.recurringParentId !== undefined) row.recurring_parent_id = task.recurringParentId;
    if (task.isRecurringInstance !== undefined) row.is_recurring_instance = task.isRecurringInstance ? 1 : 0;
    return row;
}

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

    const result = await db.getAll(
        `SELECT * FROM tasks WHERE due_date BETWEEN ? AND ? ORDER BY order_key ASC`,
        [startOfDay.getTime(), endOfDay.getTime()]
    );

    return result.map(rowToTask);
}

/**
 * Get tasks in a date range (for timeline rendering)
 */
export async function getTasksInRange(startDate: Date, endDate: Date): Promise<Task[]> {
    const result = await db.getAll(
        `SELECT * FROM tasks WHERE due_date BETWEEN ? AND ?`,
        [startDate.getTime(), endDate.getTime()]
    );
    return result.map(rowToTask);
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<Task | undefined> {
    const row = await db.get(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
    return row ? rowToTask(row) : undefined;
}

/**
 * Toggle task completion
 */
export async function toggleTaskComplete(taskId: string): Promise<void> {
    const row = await db.get<any>(`SELECT * FROM tasks WHERE id = ?`, [taskId]);

    if (row) {
        // Task exists in DB - simple toggle
        const completed = row.completed === 1;
        const updates = {
            completed: !completed ? 1 : 0,
            completed_at: !completed ? Date.now() : null,
            updated_at: Date.now(),
        };
        await db.execute(
            `UPDATE tasks SET completed = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
            [updates.completed, updates.completed_at, updates.updated_at, taskId]
        );
    } else {
        // Virtual recurring instance persistence logic
        // This part needs to be adapted or handled by the recurring logic properly.
        // For now, assuming virtual instances are created as real rows before toggling if they don't exist
        // or re-implementing the ID parsing logic.

        const underscoreIndex = taskId.lastIndexOf('_');
        if (underscoreIndex > 0) {
            const parentId = taskId.slice(0, underscoreIndex);
            const parentRow = await db.get<any>(`SELECT * FROM tasks WHERE id = ?`, [parentId]);

            if (parentRow && parentRow.recurrence) {
                const dateStr = taskId.slice(underscoreIndex + 1);
                const dueDate = parseInt(dateStr, 36);

                const instance = {
                    id: taskId,
                    title: parentRow.title,
                    type: parentRow.type,
                    content: parentRow.content,
                    due_date: dueDate,
                    completed: 1,
                    completed_at: Date.now(),
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    order_key: parentRow.order_key,
                    recurring_parent_id: parentId,
                    is_recurring_instance: 1,
                };

                await db.execute(
                    `INSERT INTO tasks (id, title, type, content, due_date, completed, completed_at, created_at, updated_at, order_key, recurring_parent_id, is_recurring_instance)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        instance.id, instance.title, instance.type, instance.content, instance.due_date,
                        instance.completed, instance.completed_at, instance.created_at, instance.updated_at,
                        instance.order_key, instance.recurring_parent_id, instance.is_recurring_instance
                    ]
                );
            }
        }
    }
}

/**
 * Update task content (for deep tasks)
 */
export async function updateTaskContent(taskId: string, content: string): Promise<void> {
    await db.execute(
        `UPDATE tasks SET content = ?, updated_at = ? WHERE id = ?`,
        [content, Date.now(), taskId]
    );
}

/**
 * Reschedule a task to a new date
 */
export async function rescheduleTask(taskId: string, newDate: Date): Promise<void> {
    await db.execute(
        `UPDATE tasks SET due_date = ?, updated_at = ? WHERE id = ?`,
        [newDate.getTime(), Date.now(), taskId]
    );
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
    await db.execute(`DELETE FROM tasks WHERE id = ?`, [taskId]);
}

/**
 * Update task fields (title, type, etc.)
 */
export async function updateTask(
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'type' | 'content' | 'recurrence'>>
): Promise<void> {
    const rowUpdates = taskToRow(updates);
    rowUpdates.updated_at = Date.now();

    // Construct dynamic UPDATE query
    const keys = Object.keys(rowUpdates);
    if (keys.length === 0) return;

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => rowUpdates[k]);
    values.push(taskId);

    await db.execute(
        `UPDATE tasks SET ${setClause} WHERE id = ?`,
        values
    );
}

// Add a helper to create task since Dexie used table.add
export async function saveTask(task: Task) {
    const row = taskToRow(task);
    await db.execute(
        `INSERT INTO tasks (id, title, type, content, due_date, completed, completed_at, created_at, updated_at, order_key, recurrence, recurring_parent_id, is_recurring_instance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            row.id, row.title, row.type, row.content, row.due_date, row.completed, row.completed_at,
            row.created_at, row.updated_at, row.order_key, row.recurrence, row.recurring_parent_id, row.is_recurring_instance
        ]
    );
}
