import { memo } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, addDays, subDays } from 'date-fns';
import { useTasksForDate } from '../../hooks/useTasks';
import { TaskItem, InlineTaskCreator } from '../tasks';

// =================================================================
// DAY AGENDA COMPONENT
// =================================================================

interface DayAgendaProps {
    date: Date;
    onDateChange: (date: Date) => void;
    onBackToCalendar?: () => void;
}

export const DayAgenda = memo(function DayAgenda({
    date,
    onDateChange,
    onBackToCalendar,
}: DayAgendaProps) {
    const tasks = useTasksForDate(date);
    const today = isToday(date);
    const completedCount = tasks.filter(t => t.completed).length;

    const goToPrevDay = () => onDateChange(subDays(date, 1));
    const goToNextDay = () => onDateChange(addDays(date, 1));
    const goToToday = () => onDateChange(new Date());

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                {/* Back Button */}
                {onBackToCalendar && (
                    <motion.button
                        onClick={onBackToCalendar}
                        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        ← Home
                    </motion.button>
                )}

                {/* Day Navigation */}
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={goToPrevDay}
                        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        ←
                    </motion.button>

                    {!today && (
                        <motion.button
                            onClick={goToToday}
                            className="px-3 py-1 text-sm rounded-full bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Today
                        </motion.button>
                    )}

                    <motion.button
                        onClick={goToNextDay}
                        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        →
                    </motion.button>
                </div>
            </div>

            {/* Day Card */}
            <motion.div
                className={`
          rounded-2xl overflow-hidden
          ${today
                        ? 'glass shadow-lg ring-1 ring-accent-primary/20'
                        : 'bg-bg-secondary/50'
                    }
        `}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={date.toISOString()}
            >
                {/* Today's special gradient border */}
                {today && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-primary/3 via-transparent to-accent-secondary/3 pointer-events-none" />
                )}

                <div className="relative p-6">
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {/* Large Date Number */}
                            <motion.div
                                className={`
                  flex items-center justify-center
                  w-16 h-16 rounded-xl
                  ${today
                                        ? 'bg-accent-primary text-white shadow-lg'
                                        : 'bg-bg-tertiary text-text-primary'
                                    }
                `}
                                whileHover={{ scale: 1.05 }}
                            >
                                <span className="text-3xl font-bold tabular-nums">
                                    {format(date, 'd')}
                                </span>
                            </motion.div>

                            {/* Day Info */}
                            <div>
                                <h2 className={`
                  text-2xl font-semibold
                  ${today ? 'text-accent-primary' : 'text-text-primary'}
                `}>
                                    {today ? 'Today' : format(date, 'EEEE')}
                                </h2>
                                <p className="text-sm text-text-muted">
                                    {format(date, 'MMMM yyyy')}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        {tasks.length > 0 && (
                            <div className="text-right">
                                <p className="text-2xl font-bold text-text-primary">
                                    {completedCount}/{tasks.length}
                                </p>
                                <p className="text-sm text-text-muted">completed</p>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className={`
            h-px mb-6
            ${today
                            ? 'bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent'
                            : 'bg-border-subtle'
                        }
          `} />

                    {/* Tasks List */}
                    <div className="space-y-2 mb-4">
                        {tasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <TaskItem task={task} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {tasks.length === 0 && (
                        <motion.div
                            className="text-center py-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <p className="text-text-muted mb-2">No tasks for this day</p>
                            <p className="text-sm text-text-muted/70">Add your first task below</p>
                        </motion.div>
                    )}

                    {/* Add Task */}
                    <div className={tasks.length > 0 ? 'pt-4 border-t border-border-subtle' : ''}>
                        <InlineTaskCreator date={date} isToday={today} />
                    </div>
                </div>

                {/* Today's accent line */}
                {today && (
                    <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-primary to-accent-secondary"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                    />
                )}
            </motion.div>
        </div>
    );
});
