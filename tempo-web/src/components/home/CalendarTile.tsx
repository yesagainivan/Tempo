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
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

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
                {calendarDays.map((day) => (
                    <CompactCalendarDay
                        key={day.toISOString()}
                        date={day}
                        isCurrentMonth={isSameMonth(day, currentMonth)}
                        isSelected={isSameDay(day, selectedDate)}
                        isToday={isToday(day)}
                        onClick={() => onSelectDate(day)}
                    />
                ))}
            </div>
        </div>
    );
});

// =================================================================
// COMPACT CALENDAR DAY CELL
// =================================================================

interface CompactCalendarDayProps {
    date: Date;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
    onClick: () => void;
}

const CompactCalendarDay = memo(function CompactCalendarDay({
    date,
    isCurrentMonth,
    isSelected,
    isToday,
    onClick,
}: CompactCalendarDayProps) {
    const taskCount = useTaskCountForDate(date);

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
        text-xs font-medium
        ${isSelected ? 'text-white' : ''}
      `}>
                {format(date, 'd')}
            </span>

            {/* Task Indicator */}
            {taskCount > 0 && (
                <div className={`
          absolute bottom-0.5 w-1 h-1 rounded-full
          ${isSelected ? 'bg-white/70' : 'bg-accent-primary'}
        `} />
            )}
        </motion.button>
    );
});
