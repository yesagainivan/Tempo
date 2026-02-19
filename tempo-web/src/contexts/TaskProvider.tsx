import React, { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { rowToTask, type Task } from '../lib/db';
import { TaskDataContext, TaskActionsContext, type ViewWindow } from './TaskContextDef';
import { format } from 'date-fns';
import { generateRecurringInstances } from '../lib/db/recurrence';

interface TaskProviderProps {
    children: React.ReactNode;
    viewWindow: ViewWindow;
}

export function TaskProvider({ children, viewWindow }: TaskProviderProps) {
    // 1. Fetch Tasks in Window (Reactive)
    // We use formatted date strings for the query to be timezone agnostic (stored as YYYY-MM-DD)
    const startStr = format(viewWindow.start, 'yyyy-MM-dd');
    const endStr = format(viewWindow.end, 'yyyy-MM-dd');

    // Fetch existing tasks in range
    const { data: rangeRows, isLoading: isLoadingTasks } = useQuery(
        `SELECT * FROM tasks WHERE due_date_local >= ? AND due_date_local <= ?`,
        [startStr, endStr],
        {
            // Coalesce rapid table-change notifications (e.g., toggling checkboxes)
            throttleMs: 200,
        }
    );

    // Fetch All Recurrence Templates (they are usually few)
    const { data: templateRows, isLoading: isLoadingTemplates } = useQuery(
        `SELECT * FROM tasks WHERE recurrence IS NOT NULL`,
        [],
        {
            // Templates rarely change — throttle more aggressively
            throttleMs: 500,
        }
    );

    // 2. Process Data & Generate Instances (Memoized)
    const startTime = viewWindow.start.getTime();
    const endTime = viewWindow.end.getTime();

    const { tasksMap, recurrenceTemplates, taskIdMap } = useMemo(() => {
        const map = new Map<string, Task[]>();
        const idMap = new Map<string, Task>();
        const templates: Task[] = [];

        // Helper to add task to maps
        const addToMaps = (task: Task) => {
            // Date Map
            const dateKey = task.dueDateLocal;
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)?.push(task);

            // ID Map
            idMap.set(task.id, task);
        };

        // A. Process Standard Tasks
        const realTaskIds = new Set<string>();
        if (rangeRows) {
            for (const row of rangeRows) {
                const task = rowToTask(row);
                // Standard tasks (non-templates or detached instances)
                if (!task.recurrence || task.isRecurringInstance) {
                    addToMaps(task);
                    realTaskIds.add(task.id);
                } else {
                    // It's a template that happens to have a due date in range?
                    // We treat templates separate usually, but if it has a due date it appears there.
                    // For safety, let's include it.
                    addToMaps(task);
                    realTaskIds.add(task.id);
                }
            }
        }

        // B. Process Recurrence Templates
        if (templateRows) {
            const temps = templateRows.map(rowToTask);
            templates.push(...temps);

            // Generate Virtual Instances
            const windowStart = new Date(startTime);
            const windowEnd = new Date(endTime);

            for (const template of temps) {
                // Also add template to ID map for direct lookup
                idMap.set(template.id, template);

                // Generate instances for the current window
                const instances = generateRecurringInstances(template, windowStart, windowEnd);

                for (const instance of instances) {
                    // Skip if already exists as a real task (completed, moved, etc)
                    if (realTaskIds.has(instance.id)) continue;

                    addToMaps(instance);
                }
            }
        }

        // C. Sort Tasks per Day
        for (const tasks of map.values()) {
            // Sort by order/priority
            tasks.sort((a, b) => a.order - b.order);
        }

        return { tasksMap: map, recurrenceTemplates: templates, taskIdMap: idMap };
    }, [rangeRows, templateRows, startTime, endTime]);

    // 3. Construct Context Values
    const dataValue = useMemo(() => ({
        tasksMap,
        recurrenceTemplates,
        taskIdMap,
        isLoading: isLoadingTasks || isLoadingTemplates,
        viewWindow
    }), [tasksMap, recurrenceTemplates, taskIdMap, isLoadingTasks, isLoadingTemplates, viewWindow]);

    const actionsValue = useMemo(() => ({
        // No actions for now, Window is controlled by App
    }), []);

    return (
        <TaskActionsContext.Provider value={actionsValue}>
            <TaskDataContext.Provider value={dataValue}>
                {children}
            </TaskDataContext.Provider>
        </TaskActionsContext.Provider>
    );
}
