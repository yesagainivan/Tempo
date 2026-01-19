import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTasksForDate } from '../../hooks/useTasks';
import { TaskItem, InlineTaskCreator } from '../tasks';

// =================================================================
// TODAY TILE - Today's Tasks with Quick Add
// =================================================================

interface TodayTileProps {
    onViewDay: () => void;
}

export const TodayTile = memo(function TodayTile({ onViewDay }: TodayTileProps) {
    const today = new Date();
    const tasks = useTasksForDate(today);
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
        <div className="glass rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 lg:p-5 border-b border-border-subtle">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Today Badge */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-primary text-white shadow-lg shadow-accent-primary/30">
                            <span className="text-lg font-bold">{format(today, 'd')}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-accent-primary">Today</h3>
                            <p className="text-xs text-text-muted">{format(today, 'EEEE, MMMM d')}</p>
                        </div>
                    </div>

                    {/* Stats & View Button */}
                    <div className="flex items-center gap-4">
                        {tasks.length > 0 && (
                            <div className="text-right">
                                <p className="text-xl font-bold text-text-primary">
                                    {completedCount}/{tasks.length}
                                </p>
                                <p className="text-xs text-text-muted">completed</p>
                            </div>
                        )}
                        <motion.button
                            onClick={onViewDay}
                            className="px-3 py-1.5 text-sm rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-glass transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            View Day →
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="p-4 lg:p-5">
                {/* Pending Tasks */}
                <AnimatePresence mode="popLayout">
                    {pendingTasks.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {pendingTasks.slice(0, 5).map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <TaskItem task={task} />
                                </motion.div>
                            ))}
                            {pendingTasks.length > 5 && (
                                <p className="text-sm text-text-muted text-center pt-2">
                                    +{pendingTasks.length - 5} more tasks
                                </p>
                            )}
                        </div>
                    )}
                </AnimatePresence>

                {/* Completed Tasks (collapsed) */}
                {completedTasks.length > 0 && pendingTasks.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs text-text-muted mb-2">
                            ✓ {completedTasks.length} completed
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {tasks.length === 0 && (
                    <motion.div
                        className="text-center py-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="text-text-muted mb-1">No tasks for today</p>
                        <p className="text-sm text-text-muted/70">Add your first task below</p>
                    </motion.div>
                )}

                {/* Quick Add */}
                <div className={tasks.length > 0 ? 'pt-3 border-t border-border-subtle' : ''}>
                    <InlineTaskCreator date={today} isToday={true} />
                </div>
            </div>

            {/* Today accent line */}
            {/* <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-primary to-accent-secondary" /> */}
        </div>
    );
});
