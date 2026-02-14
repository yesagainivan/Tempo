import { createContext } from 'react';
import type { Task } from '../lib/db';

export interface ViewWindow {
    start: Date;
    end: Date;
}

export interface TaskDataContextValue {
    // Data map: YYYY-MM-DD -> Task[]
    tasksMap: Map<string, Task[]>;
    // Raw templates (for debugging or specific needs)
    recurrenceTemplates: Task[];
    isLoading: boolean;
    // The current active window being watched
    viewWindow: ViewWindow;

    // Quick Lookup Map directly by ID (O(1))
    // Includes both standard tasks and generated instances in window
    taskIdMap: Map<string, Task>;
}

export interface TaskActionsContextValue {
    // Stable CRUD methods (create, update, delete) will go here.
    // Window management is now handled by App state.
}

export const TaskDataContext = createContext<TaskDataContextValue | undefined>(undefined);
export const TaskActionsContext = createContext<TaskActionsContextValue | undefined>(undefined);
