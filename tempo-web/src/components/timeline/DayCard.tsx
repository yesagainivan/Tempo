import { memo } from 'react';
import { motion } from 'framer-motion';
import { isToday, isPast, format } from 'date-fns';
import { useTasksForDate } from '../../hooks/useTasks';
import { TaskItem } from '../tasks/TaskItem';

// =================================================================
// DAY CARD COMPONENT
// =================================================================

interface DayCardProps {
    date: Date;
    onAddTask?: (date: Date) => void;
}

export const DayCard = memo(function DayCard({ date, onAddTask }: DayCardProps) {
    const tasks = useTasksForDate(date);
    const today = isToday(date);
    const past = isPast(date) && !today;

    // Calculate visual "weight" based on task count
    const taskCount = tasks.length;
    const loadIntensity = Math.min(taskCount / 8, 1); // Max at 8 tasks

    return (
        <motion.div
            className={`
        relative px-6 py-4 min-h-[120px]
        border-b border-border-subtle
        transition-colors duration-300
        ${today ? 'bg-accent-primary/5' : ''}
        ${past ? 'opacity-60' : ''}
      `}
            initial={{ opacity: 0 }}
            animate={{ opacity: past ? 0.6 : 1 }}
            style={{
                // Subtle glow based on load
                boxShadow: taskCount > 3
                    ? `inset 0 0 ${20 + loadIntensity * 20}px rgba(124, 92, 255, ${loadIntensity * 0.15})`
                    : 'none',
            }}
        >
            {/* Day Header */}
            <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Date Number */}
                    <span
                        className={`
              text-2xl font-bold tabular-nums
              ${today ? 'text-accent-primary' : 'text-text-primary'}
            `}
                    >
                        {format(date, 'd')}
                    </span>

                    {/* Day Name & Month */}
                    <div className="flex flex-col">
                        <span
                            className={`
                text-sm font-medium
                ${today ? 'text-accent-primary' : 'text-text-primary'}
              `}
                        >
                            {today ? 'Today' : format(date, 'EEEE')}
                        </span>
                        <span className="text-xs text-text-muted">
                            {format(date, 'MMMM yyyy')}
                        </span>
                    </div>
                </div>

                {/* Task Count Badge */}
                {taskCount > 0 && (
                    <span
                        className={`
              px-2 py-0.5 text-xs rounded-full
              ${today
                                ? 'bg-accent-primary/20 text-accent-primary'
                                : 'bg-bg-tertiary text-text-secondary'
                            }
            `}
                    >
                        {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Today Indicator Line */}
            {today && (
                <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary"
                    layoutId="today-indicator"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            )}

            {/* Tasks List */}
            <div className="space-y-2">
                {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                ))}

                {/* Empty State / Add Task */}
                {tasks.length === 0 && (
                    <button
                        onClick={() => onAddTask?.(date)}
                        className="
              w-full py-3 px-4
              text-sm text-text-muted
              border border-dashed border-border-subtle
              rounded-lg
              hover:border-accent-primary/50 hover:text-text-secondary
              transition-colors duration-200
            "
                    >
                        + Add task
                    </button>
                )}
            </div>
        </motion.div>
    );
});
