import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import type { Task, Recurrence } from '../../lib/db';
import { updateTask, rescheduleTask, db } from '../../lib/db';
import { Button } from './Button';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { RecurrencePicker } from './RecurrencePicker';
import { RepeatIcon } from '../icons';

// =================================================================
// TASK EDIT MODAL
// =================================================================

interface TaskEditModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
}

export function TaskEditModal({ task, isOpen, onClose }: TaskEditModalProps) {
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [recurrence, setRecurrence] = useState<Recurrence | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    // For recurring instances: switch to editing parent
    const [parentTask, setParentTask] = useState<Task | null>(null);
    const [isEditingParent, setIsEditingParent] = useState(false);

    // The actual task being edited (either the passed task or its parent)
    const editingTask = isEditingParent && parentTask ? parentTask : task;

    // Sync state when task changes
    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title);
            const date = new Date(editingTask.dueDate);
            setDueDate(date.toISOString().split('T')[0]);
            setRecurrence(editingTask.recurrence);
        }
    }, [editingTask]);

    // Reset parent editing state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsEditingParent(false);
            setParentTask(null);
        }
    }, [isOpen]);

    // Fetch parent task for recurring instances
    const handleEditSeries = useCallback(async () => {
        if (!task?.recurringParentId) return;

        const parent = await db.tasks.get(task.recurringParentId);
        if (parent) {
            setParentTask(parent);
            setIsEditingParent(true);
        }
    }, [task?.recurringParentId]);

    // Go back to editing the instance
    const handleBackToInstance = () => {
        setIsEditingParent(false);
        setParentTask(null);
    };

    const handleSave = useCallback(async () => {
        if (!editingTask || !title.trim()) return;

        setIsSaving(true);
        try {
            const updates: Partial<Pick<Task, 'title' | 'recurrence'>> = {};

            if (title.trim() !== editingTask.title) {
                updates.title = title.trim();
            }

            const recurrenceChanged = JSON.stringify(recurrence) !== JSON.stringify(editingTask.recurrence);
            if (recurrenceChanged) {
                updates.recurrence = recurrence;
            }

            if (Object.keys(updates).length > 0) {
                await updateTask(editingTask.id, updates);
            }

            const [year, month, day] = dueDate.split('-').map(Number);
            const newDate = new Date(year, month - 1, day);
            const oldDate = new Date(editingTask.dueDate);

            if (newDate.toDateString() !== oldDate.toDateString()) {
                await rescheduleTask(editingTask.id, newDate);
            }

            onClose();
        } finally {
            setIsSaving(false);
        }
    }, [editingTask, title, dueDate, recurrence, onClose]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, handleSave]);

    if (!task) return null;

    // Show recurrence picker only for templates (not instances)
    const showRecurrence = !editingTask?.isRecurringInstance;
    const isInstance = task.isRecurringInstance && !isEditingParent;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-bg-secondary border border-border-subtle shadow-xl"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    >
                        <div className="p-6">
                            {/* Header with context */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-text-primary">
                                    {isEditingParent
                                        ? 'Edit Recurring Series'
                                        : isInstance
                                            ? 'Edit Occurrence'
                                            : 'Edit Task'
                                    }
                                </h2>
                                {isEditingParent && (
                                    <button
                                        onClick={handleBackToInstance}
                                        className="text-xs text-text-muted hover:text-text-secondary"
                                    >
                                        ← Back to occurrence
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {/* Title Input */}
                                <Input
                                    label="Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Task title..."
                                    autoFocus
                                />

                                {/* Date Input */}
                                <DatePicker
                                    label={isEditingParent ? 'Series Start Date' : 'Due Date'}
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />

                                {/* Recurrence Picker (for templates) */}
                                {showRecurrence && (
                                    <div className="pt-2">
                                        <RecurrencePicker
                                            value={recurrence}
                                            onChange={setRecurrence}
                                        />
                                    </div>
                                )}

                                {/* Recurring Instance: Edit Series Button */}
                                {isInstance && (
                                    <button
                                        onClick={handleEditSeries}
                                        className="
                                            w-full flex items-center justify-center gap-2
                                            px-3 py-2.5 mt-2
                                            bg-accent-primary/10 hover:bg-accent-primary/15
                                            text-accent-primary text-sm font-medium
                                            rounded-lg border border-accent-primary/20
                                            transition-all duration-200
                                        "
                                    >
                                        <RepeatIcon className="w-4 h-4" />
                                        Edit Recurring Series
                                    </button>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    size="sm"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    size="sm"
                                    disabled={!title.trim() || isSaving}
                                >
                                    {isSaving ? 'Saving...' : isEditingParent ? 'Save Series' : 'Save'}
                                </Button>
                            </div>

                            {/* Keyboard hint */}
                            <p className="mt-4 text-xs text-text-muted text-center">
                                <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">⌘</kbd>
                                {' + '}
                                <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">Enter</kbd>
                                {' to save'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
