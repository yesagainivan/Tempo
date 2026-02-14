import { useContext } from 'react';
import { TaskDataContext, TaskActionsContext } from '../contexts/TaskContextDef';

export function useTaskData() {
    const context = useContext(TaskDataContext);
    if (!context) {
        throw new Error('useTaskData must be used within a TaskProvider');
    }
    return context;
}

export function useTaskActions() {
    const context = useContext(TaskActionsContext);
    if (!context) {
        throw new Error('useTaskActions must be used within a TaskProvider');
    }
    return context;
}

// This hook uses separate contexts for Data and Actions to optimize renders.
// DO NOT reintroduce a monolithic useTaskContext hook.

