import { useContext } from 'react';
import { TaskContext } from '../contexts/TaskContextDef';

export function useTaskContext() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
}
