import { memo } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow } from 'date-fns';
import { useUpcomingTasks } from '../../hooks/useTasks';

// =================================================================
// UPCOMING TILE - Next 7 Days Preview
// =================================================================

interface UpcomingTileProps {
    onSelectDate: (date: Date) => void;
}

export const UpcomingTile = memo(function UpcomingTile({ onSelectDate }: UpcomingTileProps) {
    const upcomingGroups = useUpcomingTasks(7);

    if (upcomingGroups.length === 0) {
        return (
            <div className="glass rounded-2xl p-4 lg:p-5">
                <h3 className="text-base font-semibold text-text-primary mb-3">Upcoming</h3>
                <p className="text-sm text-text-muted text-center py-4">
                    No upcoming tasks this week
                </p>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-4 lg:p-5">
            {/* Header */}
            <h3 className="text-base font-semibold text-text-primary mb-4">Upcoming</h3>

            {/* Day List */}
            <div className="space-y-2">
                {upcomingGroups.slice(0, 5).map((group, index) => (
                    <motion.button
                        key={group.date.toISOString()}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-tertiary/50 hover:bg-bg-tertiary transition-colors text-left"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSelectDate(group.date)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Date Badge */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-glass text-text-secondary">
                                <span className="text-sm font-medium">{format(group.date, 'd')}</span>
                            </div>

                            {/* Day Label */}
                            <div>
                                <p className="text-sm font-medium text-text-primary">
                                    {formatDayLabel(group.date)}
                                </p>
                                <p className="text-xs text-text-muted">
                                    {format(group.date, 'EEEE')}
                                </p>
                            </div>
                        </div>

                        {/* Task Count */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-accent-primary">
                                {group.tasks.length}
                            </span>
                            <span className="text-xs text-text-muted">
                                {group.tasks.length === 1 ? 'task' : 'tasks'}
                            </span>
                        </div>
                    </motion.button>
                ))}

                {upcomingGroups.length > 5 && (
                    <p className="text-xs text-text-muted text-center pt-2">
                        +{upcomingGroups.length - 5} more days with tasks
                    </p>
                )}
            </div>
        </div>
    );
});

// Helper to format day labels nicely
function formatDayLabel(date: Date): string {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
}
