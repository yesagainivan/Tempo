import { create } from 'zustand';
import { generateId, saveTask, deleteTask, updateTask, type Task, type TaskType } from '../lib/db';

// =================================================================
// APP STORE
// =================================================================

interface AppState {
    // Current date focus
    focusDate: Date;
    setFocusDate: (date: Date) => void;

    // Command bar state
    isCommandBarOpen: boolean;
    openCommandBar: () => void;
    closeCommandBar: () => void;
    toggleCommandBar: () => void;

    // Task expansion (for deep tasks)
    expandedTaskId: string | null;
    setExpandedTaskId: (id: string | null) => void;

    // View mode
    view: 'timeline' | 'today';
    setView: (view: 'timeline' | 'today') => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Focus date defaults to today
    focusDate: new Date(),
    setFocusDate: (date) => set({ focusDate: date }),

    // Command bar
    isCommandBarOpen: false,
    openCommandBar: () => set({ isCommandBarOpen: true }),
    closeCommandBar: () => set({ isCommandBarOpen: false }),
    toggleCommandBar: () => set((state) => ({ isCommandBarOpen: !state.isCommandBarOpen })),

    // Expanded task
    expandedTaskId: null,
    setExpandedTaskId: (id) => set({ expandedTaskId: id }),

    // View
    view: 'timeline',
    setView: (view) => set({ view }),
}));

// =================================================================
// TASK ACTIONS (separate for clarity)
// =================================================================

export async function addTask(
    title: string,
    dueDate: Date,
    type: TaskType = 'quick',
    content = '',
    recurrence?: Task['recurrence']
): Promise<string> {
    const id = generateId();
    const now = Date.now();

    const task: Task = {
        id,
        title,
        type,
        content,
        dueDate: dueDate.getTime(),
        completed: false,
        createdAt: now,
        updatedAt: now,
        order: now,
        recurrence,
    };

    await saveTask(task);
    return id;
}

export { deleteTask, updateTask };
