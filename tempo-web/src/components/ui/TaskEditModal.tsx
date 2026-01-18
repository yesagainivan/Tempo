import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import type { Task, Recurrence } from '../../lib/db';
import { updateTask, rescheduleTask } from '../../lib/db';
import { Button } from './Button';
import { Input } from './Input';
import { RecurrencePicker } from './RecurrencePicker';

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

    // Sync state when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            // Format date for input[type="date"]
            const date = new Date(task.dueDate);
            setDueDate(date.toISOString().split('T')[0]);
            setRecurrence(task.recurrence);
        }
    }, [task]);

    const handleSave = useCallback(async () => {
        if (!task || !title.trim()) return;

        setIsSaving(true);
        try {
            // Collect all updates
            const updates: Partial<Pick<Task, 'title' | 'recurrence'>> = {};

            // Update title if changed
            if (title.trim() !== task.title) {
                updates.title = title.trim();
            }

            // Update recurrence if changed
            const recurrenceChanged = JSON.stringify(recurrence) !== JSON.stringify(task.recurrence);
            if (recurrenceChanged) {
                updates.recurrence = recurrence;
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
                await updateTask(task.id, updates);
            }

            // Reschedule if date changed
            // Parse date string (YYYY-MM-DD) correctly to local timezone
            const [year, month, day] = dueDate.split('-').map(Number);
            const newDate = new Date(year, month - 1, day); // month is 0-indexed
            const oldDate = new Date(task.dueDate);

            if (newDate.toDateString() !== oldDate.toDateString()) {
                await rescheduleTask(task.id, newDate);
            }

            onClose();
        } finally {
            setIsSaving(false);
        }
    }, [task, title, dueDate, recurrence, onClose]);

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

    // Don't show recurrence for generated instances
    const showRecurrence = !task.isRecurringInstance;

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
                            <h2 className="text-lg font-semibold text-text-primary mb-4">
                                {task.isRecurringInstance ? 'Edit Instance' : 'Edit Task'}
                            </h2>

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
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-text-secondary">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="
                                            w-full px-3 py-2
                                            bg-bg-secondary
                                            border border-border-default
                                            rounded-lg
                                            text-text-primary
                                            transition-all duration-200
                                            hover:border-border-subtle
                                            focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
                                            [color-scheme:dark]
                                        "
                                    />
                                </div>

                                {/* Recurrence Picker */}
                                {showRecurrence && (
                                    <div className="pt-2">
                                        <RecurrencePicker
                                            value={recurrence}
                                            onChange={setRecurrence}
                                        />
                                    </div>
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
                                    {isSaving ? 'Saving...' : 'Save'}
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

