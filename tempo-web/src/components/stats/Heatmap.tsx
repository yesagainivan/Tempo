import { memo, useMemo } from 'react';
import { eachDayOfInterval, format, subDays, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { motion } from 'framer-motion';

interface HeatmapProps {
    data: Map<string, number>;
}

export const Heatmap = memo(function Heatmap({ data }: HeatmapProps) {
    // Generate dates for the last 52 weeks (approx 1 year)
    // We want the grid to end on "Today" or end of this week
    const dates = useMemo(() => {
        const today = new Date();
        const end = endOfWeek(today); // Fill to end of current week
        const start = subDays(end, 364); // roughly 52 weeks

        // Ensure start is beginning of a week for clean grid
        const gridStart = startOfWeek(start);

        return eachDayOfInterval({ start: gridStart, end });
    }, []);

    // Helper to get color intensity
    const getColor = (count: number) => {
        if (count === 0) return 'bg-bg-tertiary/50 hover:bg-bg-tertiary';
        if (count <= 2) return 'bg-accent-primary/30 hover:bg-accent-primary/40'; // Low
        if (count <= 4) return 'bg-accent-primary/60 hover:bg-accent-primary/70'; // Medium
        if (count <= 6) return 'bg-accent-primary/80 hover:bg-accent-primary/90'; // High
        return 'bg-accent-primary hover:bg-accent-primary/90 shadow-sm shadow-accent-primary/20'; // Extreme
    };

    // Calculate months labels positions
    const monthLabels = useMemo(() => {
        const labels: { text: string; index: number }[] = [];
        let currentMonth = -1;

        dates.forEach((date, i) => {
            // Only check first day of each column (Sundays)
            if (getDay(date) === 0) {
                const m = date.getMonth();
                if (m !== currentMonth) {
                    labels.push({ text: format(date, 'MMM'), index: Math.floor(i / 7) });
                    currentMonth = m;
                }
            }
        });
        return labels;
    }, [dates]);

    return (
        <div className="flex flex-col gap-2">
            {/* Legend / Header */}
            <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                <span>{dates.length} days</span>
                <div className="flex items-center gap-1">
                    <span>Less</span>
                    <div className="flex gap-0.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-bg-tertiary/50" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent-primary/30" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent-primary/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent-primary" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            {/* Scrolling Container for mobile */}
            <div className="overflow-x-auto pb-2 scrollbar-hide">
                <div className="min-w-max">
                    {/* Month Labels */}
                    <div className="flex mb-1 tick-labels h-4 relative">
                        {monthLabels.map((label, i) => (
                            <span
                                key={i}
                                className="absolute text-[10px] text-text-muted font-medium"
                                style={{ left: `${label.index * 14}px` }} // 10px w + 2px gap + ... rough calc
                            >
                                {label.text}
                            </span>
                        ))}
                    </div>

                    {/* The Grid: CSS Grid with 7 rows (days) */}
                    <div
                        className="grid grid-rows-7 gap-1"
                        style={{ gridAutoFlow: 'column' }}
                    >
                        {dates.map((date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const count = data.get(dateStr) || 0;

                            return (
                                <motion.div
                                    key={dateStr}
                                    title={`${count} tasks on ${format(date, 'MMM d, yyyy')}`}
                                    className={`
                                        w-2.5 h-2.5 rounded-sm 
                                        transition-colors duration-200
                                        ${getColor(count)}
                                    `}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: Math.random() * 0.5 }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});
