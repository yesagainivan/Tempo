import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../lib/db';
import { toggleTaskComplete } from '../../lib/db';
import { Checkbox } from '../ui';
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

    const handleToggle = async () => {
        await toggleTaskComplete(task.id);
    };

    const handleClick = () => {
        if (isDeep) {
            setExpandedTaskId(isExpanded ? null : task.id);
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
        ${isDeep ? 'cursor-pointer' : ''}
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

            {/* Type Badge */}
            {isDeep && (
                <motion.span
                    className="
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
