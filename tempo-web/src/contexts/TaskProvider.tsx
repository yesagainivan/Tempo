import React, { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { rowToTask } from '../lib/db';
import { TaskContext } from './TaskContextDef';

export function TaskProvider({ children }: { children: React.ReactNode }) {
    // Single subscription to all recurring templates
    // This replaces the repeated query in useTasks.ts
    const { data: templateRows, isLoading } = useQuery(
        `SELECT * FROM tasks WHERE recurrence IS NOT NULL`
    );

    const recurrenceTemplates = useMemo(() => {
        if (!templateRows) return [];
        return templateRows.map(rowToTask);
    }, [templateRows]);

    const value = useMemo(() => ({
        recurrenceTemplates,
        isLoading
    }), [recurrenceTemplates, isLoading]);

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
}
