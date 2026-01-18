import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../lib/db';
import { toggleTaskComplete, deleteTask, updateTask } from '../../lib/db';
import { Checkbox, ConfirmDialog, TaskEditModal } from '../ui';
import { RecurrenceBadge } from '../ui/RecurrencePicker';
import { TrashIcon, PencilIcon, DocumentIcon, LightningIcon, NoteIcon } from '../icons';
import { useAppStore } from '../../stores/appStore';
import { DeepTaskEditor } from './DeepTaskEditor';

// =================================================================
// TASK ITEM COMPONENT - Elegant Card Style
// =================================================================

interface TaskItemProps {
    task: Task;
}

export const TaskItem = memo(function TaskItem({ task }: TaskItemProps) {
    const { setExpandedTaskId, expandedTaskId } = useAppStore();
    const isExpanded = expandedTaskId === task.id;
    const isDeep = task.type === 'deep';
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDemoting, setIsDemoting] = useState(false);

    const handleToggle = async () => {
        await toggleTaskComplete(task.id);
    };

    const handleDelete = async () => {
        await deleteTask(task.id);
    };

    const handleClick = () => {
        if (isDeep) {
            // Deep tasks expand to show notes
            setExpandedTaskId(isExpanded ? null : task.id);
        } else {
            // Quick tasks open edit modal
            setIsEditing(true);
        }
    };

    // Promote quick task to deep task (instant)
    const handlePromote = async () => {
        await updateTask(task.id, { type: 'deep' });
        // Auto-expand for immediate editing
        setExpandedTaskId(task.id);
    };

    // Demote deep task to quick task (needs confirmation if has content)
    const handleDemote = async () => {
        if (task.content && task.content.trim()) {
            // Has content - show confirmation
            setIsDemoting(true);
        } else {
            // No content - demote immediately
            await updateTask(task.id, { type: 'quick', content: '' });
        }
    };

    const confirmDemote = async () => {
        await updateTask(task.id, { type: 'quick', content: '' });
        setExpandedTaskId(null);
        setIsDemoting(false);
    };

    return (
        <motion.div
            className={`
        group relative flex items-start gap-3
        p-3 sm:p-4 rounded-xl
        bg-bg-tertiary/50
        border border-transparent
        transition-all duration-200
        ${task.completed ? 'opacity-50' : ''}
        ${isExpanded ? 'bg-bg-tertiary border-border-subtle' : 'hover:bg-bg-tertiary hover:border-border-subtle cursor-pointer'}
      `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: task.completed ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            whileHover={isExpanded ? undefined : { scale: 1.01 }}
            transition={{ duration: 0.15 }}
        >
            {/* Checkbox */}
            <div className="pt-0.5 flex-shrink-0">
                <Checkbox
                    checked={task.completed}
                    onCheckedChange={handleToggle}
                />
            </div>

            {/* Task Content */}
            <div
                className="flex-1 min-w-0"
                onClick={handleClick}
            >
                <p
                    className={`
            text-sm sm:text-base leading-relaxed
            transition-all duration-200
            ${task.completed
                            ? 'line-through text-text-muted'
                            : 'text-text-primary'
                        }
          `}
                >
                    {task.title}
                </p>

                {/* Deep Task Indicator */}
                {isDeep && !isExpanded && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs text-text-muted bg-bg-glass px-2 py-0.5 rounded-full">
                            <NoteIcon className="w-3 h-3" />
                            Notes
                        </span>
                        {task.recurrence && (
                            <RecurrenceBadge recurrence={task.recurrence} />
                        )}
                        <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to expand
                        </span>
                    </div>
                )}

                {/* Quick Task - Recurrence Badge (when not deep) */}
                {!isDeep && task.recurrence && !task.completed && (
                    <div className="mt-1">
                        <RecurrenceBadge recurrence={task.recurrence} />
                    </div>
                )}

                {/* Quick Task Hint */}
                {!isDeep && !task.completed && (
                    <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1 block">
                        Click to edit
                    </span>
                )}

                {/* Expanded Content for Deep Tasks */}
                <AnimatePresence>
                    {isDeep && isExpanded && (
                        <DeepTaskEditor
                            task={task}
                            onCollapse={() => setExpandedTaskId(null)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Action Buttons - always visible when expanded, hover otherwise */}
            <div className={`
                flex items-center gap-1
                transition-opacity duration-200
                ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                ${task.completed ? 'opacity-0' : ''}
            `}>
                {/* Type Toggle Button */}
                <button
                    className={`
                        p-1.5 text-text-muted rounded-lg transition-colors
                        ${isDeep
                            ? 'hover:text-warning hover:bg-warning/10'
                            : 'hover:text-accent-primary hover:bg-accent-primary/10'
                        }
                    `}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isDeep) {
                            handleDemote();
                        } else {
                            handlePromote();
                        }
                    }}
                    title={isDeep ? 'Convert to quick task' : 'Add notes (deep task)'}
                >
                    {isDeep ? (
                        <LightningIcon className="w-4 h-4" />
                    ) : (
                        <DocumentIcon className="w-4 h-4" />
                    )}
                </button>

                {/* Edit Button */}
                <button
                    className="p-1.5 text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                >
                    <PencilIcon className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                    className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleting(true);
                    }}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Edit Modal */}
            <TaskEditModal
                task={task}
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleting}
                onClose={() => setIsDeleting(false)}
                onConfirm={handleDelete}
                title={
                    task.recurrence
                        ? 'Delete Recurring Task'
                        : task.isRecurringInstance
                            ? 'Delete This Occurrence'
                            : 'Delete Task'
                }
                description={
                    task.recurrence
                        ? `Are you sure you want to delete "${task.title}"? This will stop all future occurrences.`
                        : task.isRecurringInstance
                            ? `This will only delete this single occurrence of "${task.title}". Future occurrences will not be affected.`
                            : `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
                }
                confirmText={task.recurrence ? 'Delete All' : 'Delete'}
                variant="danger"
            />

            {/* Demote Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDemoting}
                onClose={() => setIsDemoting(false)}
                onConfirm={confirmDemote}
                title="Convert to Quick Task"
                description="This will delete all notes attached to this task. This action cannot be undone."
                confirmText="Delete Notes"
                variant="danger"
            />

            {/* Type Badge - hide on hover and when expanded */}
            {isDeep && !isExpanded && (
                <span
                    className="
            absolute top-3 right-3
            px-2 py-1 text-[10px] uppercase tracking-wider font-medium
            bg-accent-primary/10 text-accent-primary
            rounded-md flex-shrink-0
            opacity-100 group-hover:opacity-0 transition-opacity duration-200
            animate-[fadeIn_0.2s_ease-out]
          "
                >
                    Deep
                </span>
            )}

            {/* Completion Celebration */}
            {task.completed && (
                <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="absolute inset-0 bg-success/5 rounded-xl" />
                </motion.div>
            )}
        </motion.div>
    );
});
