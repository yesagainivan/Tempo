import { column, Schema, Table } from '@powersync/web';

export const TASKS_TABLE = 'tasks';

export const AppSchema = new Schema({
    [TASKS_TABLE]: new Table({
        title: column.text,
        type: column.text,          // 'quick' | 'deep'
        content: column.text,
        due_date: column.integer,   // unix timestamp
        completed: column.integer,  // boolean as 0/1
        completed_at: column.integer,
        created_at: column.integer,
        updated_at: column.integer,
        order_key: column.integer,  // 'order' is a reserved word

        // Recurring task fields
        recurrence: column.text,           // JSON string
        recurring_parent_id: column.text,
        is_recurring_instance: column.integer
    }, {
        indexes: {
            due_date: ['due_date'],
            completed_at: ['completed_at'],
            completed: ['completed'],
            // Performance: Index recurrence to prevent full table scans on Home tab
            recurrence: ['recurrence'],
            is_recurring_instance: ['is_recurring_instance']
        }
    })
});
