import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isSameDay,
    startOfDay,
} from 'date-fns';
import { useTasksInRange } from '../../hooks/useTasks';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import type { Task } from '../../lib/db';

// =================================================================
// CALENDAR TILE - Compact Calendar for Dashboard
// =================================================================

interface CalendarTileProps {
    currentMonth: Date;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarTile = memo(function CalendarTile({
    currentMonth,
    selectedDate,
    onSelectDate,
    onPrevMonth,
    onNextMonth,
}: CalendarTileProps) {
    // 1. Calculate Grid Range
    const { calendarDays, startRange, endRange } = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        return {
            calendarDays: eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
            startRange: calendarStart,
            endRange: calendarEnd
        };
    }, [currentMonth]);

    // 2. Fetch Tasks efficiently for the whole range
    const tasks = useTasksInRange(startRange, endRange);

    // 3. Group tasks by day [timestamp -> tasks[]]
    const tasksByDay = useMemo(() => {
        const map = new Map<number, Task[]>();
        tasks.forEach(task => {
            // We use due date to place it on the calendar
            // Use startOfDay to normalize
            const dayTs = startOfDay(new Date(task.dueDate)).getTime();
            if (!map.has(dayTs)) {
                map.set(dayTs, []);
            }
            map.get(dayTs)?.push(task);
        });
        return map;
    }, [tasks]);

    return (
        <div className="glass rounded-2xl p-4 lg:p-5 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <motion.button
                    onClick={onPrevMonth}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                </motion.button>

                <motion.h3
                    className="text-base font-semibold text-text-primary"
                    key={format(currentMonth, 'yyyy-MM')}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {format(currentMonth, 'MMMM yyyy')}
                </motion.h3>

                <motion.button
                    onClick={onNextMonth}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronRightIcon className="w-4 h-4" />
                </motion.button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-[10px] font-medium text-text-muted py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                    const dayTs = startOfDay(day).getTime();
                    const dayTasks = tasksByDay.get(dayTs) || [];

                    return (
                        <CompactCalendarDay
                            key={day.toISOString()}
                            date={day}
                            tasks={dayTasks}
                            isCurrentMonth={isSameMonth(day, currentMonth)}
                            isSelected={isSameDay(day, selectedDate)}
                            isToday={isToday(day)}
                            onClick={() => onSelectDate(day)}
                        />
                    );
                })}
            </div>
        </div>
    );
});

// =================================================================
// COMPACT CALENDAR DAY CELL
// =================================================================

interface CompactCalendarDayProps {
    date: Date;
    tasks: Task[];
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
    onClick: () => void;
}

const CompactCalendarDay = memo(function CompactCalendarDay({
    date,
    tasks,
    isCurrentMonth,
    isSelected,
    isToday,
    onClick,
}: CompactCalendarDayProps) {
    // Limit to 12 tasks for the "clock" visualization
    const displayTasks = useMemo(() => {
        // Sort: Completed last? Or maybe just consistent order
        // Let's keep them sorted by creation or order to keep dots stable
        // The parent usually returns them sorted by order.
        return tasks.slice(0, 12);
    }, [tasks]);

    return (
        <motion.button
            onClick={onClick}
            className={`
        relative aspect-square p-0.5
        flex flex-col items-center justify-center
        rounded-lg
        transition-all duration-150
        ${!isCurrentMonth ? 'opacity-30' : ''}
        ${isSelected
                    ? 'bg-accent-primary text-white shadow-md shadow-accent-primary/30'
                    : isToday
                        ? 'bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/30'
                        : 'hover:bg-bg-tertiary hover:ring-1 hover:ring-border-subtle text-text-primary'
                }
      `}
            whileTap={{ scale: 0.95 }}
        >
            {/* Day Number */}
            <span className={`
        text-xs font-medium z-10
        ${isSelected ? 'text-white' : ''}
      `}>
                {format(date, 'd')}
            </span>

            {/* Task Indicators (Clock) */}
            {displayTasks.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                    {displayTasks.map((task, i) => {
                        const count = displayTasks.length;
                        // Calculate position on a circle
                        // Start from top (expiry usually 12 o'clock)
                        // Angle: -90 deg is top.
                        // Even distribution looks cleaner for small numbers.

                        const angleStep = 360 / count;
                        const angle = i * angleStep - 90; // -90 to start at top

                        // Radius: we need to place them around the center number.
                        // The button is roughly 40x40 to 50x50 depending on screen. 
                        // Let's use % to be responsive.
                        // Center is 50%, 50%. Radius should be ~35%.
                        const radius = 32; // percent

                        // Convert polar to cartesian
                        const radian = (angle * Math.PI) / 180;
                        const x = 50 + radius * Math.cos(radian);
                        const y = 50 + radius * Math.sin(radian);

                        return (
                            <div
                                key={task.id}
                                className={`
                                    absolute w-1 h-1 rounded-full
                                    ${task.completed
                                        ? (isSelected ? 'bg-white/80' : 'bg-success')
                                        : (isSelected ? 'bg-white/40' : 'bg-text-muted')
                                    }
                                `}
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </motion.button>
    );
});
