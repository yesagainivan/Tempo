import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../lib/db';
import { toggleTaskComplete, deleteTask } from '../../lib/db';
import { Checkbox, ConfirmDialog, TaskEditModal } from '../ui';
import { TrashIcon, PencilIcon } from '../icons';
import { useAppStore } from '../../stores/appStore';

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

    return (
        <motion.div
            layout
            className={`
        group relative flex items-start gap-3
        p-3 sm:p-4 rounded-xl
        bg-bg-tertiary/50 hover:bg-bg-tertiary
        border border-transparent hover:border-border-subtle
        transition-all duration-200
        ${task.completed ? 'opacity-50' : ''}
        cursor-pointer
      `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: task.completed ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            whileHover={{ scale: 1.01 }}
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
                        <span className="text-xs text-text-muted bg-bg-glass px-2 py-0.5 rounded-full">
                            📝 Notes
                        </span>
                        <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to expand
                        </span>
                    </div>
                )}

                {/* Quick Task Hint */}
                {!isDeep && !task.completed && (
                    <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1 block">
                        Click to edit
                    </span>
                )}

                {/* Expanded Content for Deep Tasks */}
                {isDeep && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-border-subtle"
                    >
                        <div className="bg-bg-glass rounded-lg p-4">
                            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                                {task.content || 'No content yet. Click to add notes...'}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Action Buttons (Hover) */}
            <div className={`
                flex items-center gap-1
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                ${task.completed ? 'opacity-0' : ''}
            `}>
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
                title="Delete Task"
                description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />

            {/* Type Badge */}
            {isDeep && (
                <motion.span
                    className="
            absolute top-3 right-3
            px-2 py-1 text-[10px] uppercase tracking-wider font-medium
            bg-accent-primary/10 text-accent-primary
            rounded-md flex-shrink-0
          "
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    Deep
                </motion.span>
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
