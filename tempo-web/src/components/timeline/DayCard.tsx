import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday, isPast, isTomorrow, format } from 'date-fns';

import { useTasksForDate } from '../../hooks/useTasks';
import { CheckIcon } from '../icons';
import { TaskItem, InlineTaskCreator } from '../tasks';

// =================================================================
// DAY CARD COMPONENT - Elegant Agenda Style
// =================================================================

interface DayCardProps {
    date: Date;
}

export const DayCard = memo(function DayCard({ date }: DayCardProps) {
    const tasks = useTasksForDate(date);
    const today = isToday(date);
    const tomorrow = isTomorrow(date);
    const past = isPast(date) && !today;

    // Visual weight based on task count
    const taskCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const loadIntensity = Math.min(taskCount / 8, 1);

    // Get day label
    const getDayLabel = () => {
        if (today) return 'Today';
        if (tomorrow) return 'Tomorrow';
        return format(date, 'EEEE');
    };

    return (
        <div className="px-4 sm:px-8 lg:px-16 py-2">
            <motion.div
                className={`
          relative max-w-3xl mx-auto
          rounded-2xl overflow-hidden
          transition-all duration-300
          ${today
                        ? 'glass shadow-lg ring-1 ring-accent-primary/20'
                        : past
                            ? 'bg-bg-secondary/30'
                            : 'bg-bg-secondary/50 hover:bg-bg-secondary/70'
                    }
        `}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                    opacity: past ? 0.5 : 1,
                    y: 0,
                }}
                transition={{ duration: 0.3 }}
                style={{
                    // Subtle glow for busy days
                    boxShadow: today && taskCount > 0
                        ? `0 0 ${30 + loadIntensity * 30}px rgba(124, 92, 255, ${0.1 + loadIntensity * 0.1})`
                        : undefined,
                }}
            >
                {/* Today's special gradient border */}
                {today && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-secondary/5 pointer-events-none" />
                )}

                {/* Content Container */}
                <div className="relative p-5 sm:p-6">
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {/* Large Date Number */}
                            <motion.div
                                className={`
                  flex items-center justify-center
                  w-14 h-14 rounded-xl
                  ${today
                                        ? 'bg-accent-primary text-white shadow-lg'
                                        : 'bg-bg-tertiary text-text-primary'
                                    }
                `}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                <span className="text-2xl font-bold tabular-nums">
                                    {format(date, 'd')}
                                </span>
                            </motion.div>

                            {/* Day Info */}
                            <div>
                                <h3 className={`
                  text-lg font-semibold
                  ${today ? 'text-accent-primary' : 'text-text-primary'}
                `}>
                                    {getDayLabel()}
                                </h3>
                                <p className="text-sm text-text-muted">
                                    {format(date, 'MMMM yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Stats Badge */}
                        {taskCount > 0 && (
                            <motion.div
                                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                  ${today
                                        ? 'bg-accent-primary/15 text-accent-primary'
                                        : 'bg-bg-tertiary text-text-secondary'
                                    }
                `}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.1 }}
                            >
                                {completedCount > 0 && (
                                    <span className="text-success flex items-center gap-1">
                                        <CheckIcon size={14} /> {completedCount}
                                    </span>
                                )}
                                {completedCount > 0 && completedCount < taskCount && (
                                    <span className="text-text-muted">·</span>
                                )}
                                {completedCount < taskCount && (
                                    <span>{taskCount - completedCount} remaining</span>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className={`
            h-px mb-4
            ${today
                            ? 'bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent'
                            : 'bg-border-subtle'
                        }
          `} />

                    {/* Tasks List */}
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            className="space-y-2"
                            variants={{
                                visible: { transition: { staggerChildren: 0.05 } }
                            }}
                            initial="hidden"
                            animate="visible"
                        >
                            {tasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    variants={{
                                        hidden: { opacity: 0, x: -20 },
                                        visible: { opacity: 1, x: 0 },
                                        exit: { opacity: 0, x: 20 }
                                    }}
                                    layout
                                    transition={{
                                        layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                                    }}
                                >
                                    <TaskItem task={task} />
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Add Task Section */}
                    <div className={tasks.length > 0 ? 'mt-3 pt-3 border-t border-border-subtle' : ''}>
                        <InlineTaskCreator date={date} isToday={today} />
                    </div>
                </div>

                {/* Today's accent line */}
                {/* {today && (
                    <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-primary to-accent-secondary"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                )} */}
            </motion.div>
        </div>
    );
});
