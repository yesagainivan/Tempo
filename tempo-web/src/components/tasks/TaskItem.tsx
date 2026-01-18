import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../lib/db';
import { toggleTaskComplete } from '../../lib/db';
import { Checkbox } from '../ui';
import { useAppStore } from '../../stores/appStore';

// =================================================================
// TASK ITEM COMPONENT
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
        p-3 rounded-lg
        transition-colors duration-200
        ${task.completed ? 'opacity-60' : ''}
        ${isDeep ? 'cursor-pointer hover:bg-bg-glass' : ''}
      `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: task.completed ? 0.6 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            {/* Checkbox */}
            <div className="pt-0.5">
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
            text-sm leading-relaxed
            ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}
          `}
                >
                    {task.title}
                </p>

                {/* Deep Task Indicator */}
                {isDeep && !isExpanded && (
                    <span className="text-xs text-text-muted mt-1 block">
                        📝 Click to expand
                    </span>
                )}

                {/* Expanded Content for Deep Tasks */}
                {isDeep && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border-subtle"
                    >
                        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">
                            {task.content || 'No content yet...'}
                        </pre>
                    </motion.div>
                )}
            </div>

            {/* Type Badge */}
            {isDeep && (
                <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-bg-tertiary text-text-muted rounded">
                    deep
                </span>
            )}
        </motion.div>
    );
});
