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
} from 'date-fns';
import { useTaskCountForDate } from '../../hooks/useTasks';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';

// =================================================================
// MONTH CALENDAR COMPONENT
// =================================================================

interface MonthCalendarProps {
    currentMonth: Date;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MonthCalendar = memo(function MonthCalendar({
    currentMonth,
    selectedDate,
    onSelectDate,
    onPrevMonth,
    onNextMonth,
}: MonthCalendarProps) {
    // Calculate all days to display (including days from prev/next month to fill grid)
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <motion.button
                    onClick={onPrevMonth}
                    className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </motion.button>

                <motion.h2
                    className="text-xl font-semibold text-text-primary"
                    key={format(currentMonth, 'yyyy-MM')}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {format(currentMonth, 'MMMM yyyy')}
                </motion.h2>

                <motion.button
                    onClick={onNextMonth}
                    className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-text-muted py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                    <CalendarDay
                        key={day.toISOString()}
                        date={day}
                        isCurrentMonth={isSameMonth(day, currentMonth)}
                        isSelected={isSameDay(day, selectedDate)}
                        isToday={isToday(day)}
                        onClick={() => onSelectDate(day)}
                        delay={index * 0.01}
                    />
                ))}
            </div>
        </div>
    );
});

// =================================================================
// CALENDAR DAY CELL
// =================================================================

interface CalendarDayProps {
    date: Date;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
    onClick: () => void;
    delay: number;
}

const CalendarDay = memo(function CalendarDay({
    date,
    isCurrentMonth,
    isSelected,
    isToday,
    onClick,
    delay,
}: CalendarDayProps) {
    const taskCount = useTaskCountForDate(date);

    return (
        <motion.button
            onClick={onClick}
            className={`
        relative aspect-square p-1
        flex flex-col items-center justify-center
        rounded-xl
        transition-all duration-200
        ${!isCurrentMonth ? 'opacity-30' : ''}
        ${isSelected
                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30'
                    : isToday
                        ? 'bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/30'
                        : 'hover:bg-bg-tertiary text-text-primary'
                }
      `}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isCurrentMonth ? 1 : 0.3, scale: 1 }}
            transition={{ delay, duration: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Day Number */}
            <span className={`
        text-sm font-medium
        ${isSelected ? 'text-white' : ''}
      `}>
                {format(date, 'd')}
            </span>

            {/* Task Indicator Dots */}
            {taskCount > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                        <div
                            key={i}
                            className={`
                w-1 h-1 rounded-full
                ${isSelected ? 'bg-white/70' : 'bg-accent-primary'}
              `}
                        />
                    ))}
                    {taskCount > 3 && (
                        <span className={`
              text-[8px] ml-0.5
              ${isSelected ? 'text-white/70' : 'text-accent-primary'}
            `}>
                            +
                        </span>
                    )}
                </div>
            )}
        </motion.button>
    );
});
