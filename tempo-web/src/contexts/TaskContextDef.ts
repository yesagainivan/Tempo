import { createContext } from 'react';
import type { Task } from '../lib/db';

export interface TaskContextData {
    recurrenceTemplates: Task[];
    isLoading: boolean;
}

export const TaskContext = createContext<TaskContextData | undefined>(undefined);
