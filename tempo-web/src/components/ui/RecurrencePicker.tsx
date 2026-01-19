import { useState, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recurrence, RecurrencePattern } from '../../lib/db';
import { formatRecurrence } from '../../lib/db/recurrence';
import { RepeatIcon } from '../icons';
import { DatePicker } from './DatePicker';

// =================================================================
// RECURRENCE PICKER - Elegant inline recurrence selector
// =================================================================

interface RecurrencePickerProps {
    value?: Recurrence;
    onChange: (recurrence: Recurrence | undefined) => void;
}

const PATTERNS: { value: RecurrencePattern; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

const WEEKDAYS = [
    { value: 0, label: 'S', fullLabel: 'Sun' },
    { value: 1, label: 'M', fullLabel: 'Mon' },
    { value: 2, label: 'T', fullLabel: 'Tue' },
    { value: 3, label: 'W', fullLabel: 'Wed' },
    { value: 4, label: 'T', fullLabel: 'Thu' },
    { value: 5, label: 'F', fullLabel: 'Fri' },
    { value: 6, label: 'S', fullLabel: 'Sat' },
];

export const RecurrencePicker = memo(function RecurrencePicker({
    value,
    onChange,
}: RecurrencePickerProps) {
    const [isExpanded, setIsExpanded] = useState(!!value);
    const [pattern, setPattern] = useState<RecurrencePattern>(value?.pattern || 'daily');
    const [interval, setInterval] = useState(value?.interval || 1);
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value?.daysOfWeek || []);
    const [hasEndDate, setHasEndDate] = useState(!!value?.endDate);
    const [endDate, setEndDate] = useState<string>(
        value?.endDate ? new Date(value.endDate).toISOString().split('T')[0] : ''
    );

    // Sync internal state when value prop changes (e.g., when switching to edit parent)
    useEffect(() => {
        if (value) {
            setIsExpanded(true);
            setPattern(value.pattern);
            setInterval(value.interval);
            setDaysOfWeek(value.daysOfWeek || []);
            setHasEndDate(!!value.endDate);
            setEndDate(value.endDate ? new Date(value.endDate).toISOString().split('T')[0] : '');
        } else {
            setIsExpanded(false);
            setPattern('daily');
            setInterval(1);
            setDaysOfWeek([]);
            setHasEndDate(false);
            setEndDate('');
        }
    }, [value]);

    const updateRecurrence = useCallback((updates: Partial<Recurrence> & { endDate?: number }) => {
        const newRecurrence: Recurrence = {
            pattern: updates.pattern ?? pattern,
            interval: updates.interval ?? interval,
            daysOfWeek: updates.pattern === 'weekly' || pattern === 'weekly'
                ? (updates.daysOfWeek ?? daysOfWeek)
                : undefined,
            endDate: updates.endDate !== undefined ? updates.endDate : (hasEndDate && endDate ? new Date(endDate).getTime() : undefined),
        };
        onChange(newRecurrence);
    }, [pattern, interval, daysOfWeek, hasEndDate, endDate, onChange]);

    const handlePatternChange = (newPattern: RecurrencePattern) => {
        setPattern(newPattern);
        // Reset days of week when switching away from weekly
        if (newPattern !== 'weekly') {
            setDaysOfWeek([]);
        }
        updateRecurrence({ pattern: newPattern, daysOfWeek: newPattern === 'weekly' ? daysOfWeek : undefined });
    };

    const handleIntervalChange = (newInterval: number) => {
        const validInterval = Math.max(1, Math.min(99, newInterval));
        setInterval(validInterval);
        updateRecurrence({ interval: validInterval });
    };

    const toggleDayOfWeek = (day: number) => {
        const newDays = daysOfWeek.includes(day)
            ? daysOfWeek.filter(d => d !== day)
            : [...daysOfWeek, day].sort((a, b) => a - b);
        setDaysOfWeek(newDays);
        updateRecurrence({ daysOfWeek: newDays });
    };

    const handleEndDateToggle = () => {
        const newHasEndDate = !hasEndDate;
        setHasEndDate(newHasEndDate);
        if (!newHasEndDate) {
            setEndDate('');
            updateRecurrence({ endDate: undefined });
        }
    };

    const handleEndDateChange = (value: string) => {
        setEndDate(value);
        if (value) {
            const timestamp = new Date(value).getTime();
            updateRecurrence({ endDate: timestamp });
        }
    };

    const handleToggle = () => {
        if (isExpanded) {
            onChange(undefined);
            setIsExpanded(false);
        } else {
            setIsExpanded(true);
            updateRecurrence({});
        }
    };

    const getIntervalLabel = () => {
        const plural = interval > 1;
        switch (pattern) {
            case 'daily': return plural ? 'days' : 'day';
            case 'weekly': return plural ? 'weeks' : 'week';
            case 'monthly': return plural ? 'months' : 'month';
            case 'yearly': return plural ? 'years' : 'year';
        }
    };

    return (
        <div className="space-y-3">
            {/* Toggle Button */}
            <button
                type="button"
                onClick={handleToggle}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm rounded-lg
                    transition-all duration-200
                    ${isExpanded
                        ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80 border border-transparent'
                    }
                `}
            >
                <RepeatIcon className="w-4 h-4" />
                <span>{isExpanded ? (value ? formatRecurrence(value) : 'Repeating') : 'Set repeat'}</span>
            </button>

            {/* Expanded Options */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 p-1">
                            {/* Pattern Pills */}
                            <div className="flex flex-wrap gap-2">
                                {PATTERNS.map(({ value: p, label }) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => handlePatternChange(p)}
                                        className={`
                                            px-3 py-1.5 text-xs font-medium rounded-full
                                            transition-all duration-200
                                            ${pattern === p
                                                ? 'bg-accent-primary text-white shadow-sm'
                                                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                                            }
                                        `}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Interval Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-text-secondary">Every</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={interval}
                                    onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                                    className="
                                        w-14 px-2 py-1 text-sm text-center
                                        bg-bg-tertiary border border-border-subtle rounded-lg
                                        text-text-primary
                                        focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30
                                    "
                                />
                                <span className="text-sm text-text-secondary">{getIntervalLabel()}</span>
                            </div>

                            {/* Day of Week Chips (for weekly) */}
                            <AnimatePresence>
                                {pattern === 'weekly' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="space-y-2">
                                            <span className="text-xs text-text-muted">On these days:</span>
                                            <div className="flex gap-1.5">
                                                {WEEKDAYS.map(({ value: day, label, fullLabel }) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => toggleDayOfWeek(day)}
                                                        title={fullLabel}
                                                        className={`
                                                            w-8 h-8 text-xs font-medium rounded-full
                                                            transition-all duration-200
                                                            ${daysOfWeek.includes(day)
                                                                ? 'bg-accent-primary text-white shadow-sm'
                                                                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                                                            }
                                                        `}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* End Date Toggle & Input */}
                            <div className="pt-2 space-y-2">
                                <button
                                    type="button"
                                    onClick={handleEndDateToggle}
                                    className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
                                >
                                    <div className={`
                                        w-4 h-4 rounded border transition-all
                                        ${hasEndDate
                                            ? 'bg-accent-primary border-accent-primary'
                                            : 'border-border-default'
                                        }
                                    `}>
                                        {hasEndDate && (
                                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                    End date
                                </button>

                                <AnimatePresence>
                                    {hasEndDate && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <DatePicker
                                                value={endDate}
                                                onChange={(e) => handleEndDateChange(e.target.value)}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
});

// =================================================================
// RECURRENCE BADGE - Compact indicator for task items
// =================================================================

interface RecurrenceBadgeProps {
    recurrence: Recurrence;
    className?: string;
}

export const RecurrenceBadge = memo(function RecurrenceBadge({
    recurrence,
    className = '',
}: RecurrenceBadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1 px-1.5 py-0.5
                text-[10px] font-medium
                bg-accent-primary/10 text-accent-primary
                rounded-md
                ${className}
            `}
            title={formatRecurrence(recurrence)}
        >
            <RepeatIcon className="w-3 h-3" />
            <span>{formatRecurrence(recurrence)}</span>
        </span>
    );
});

// =================================================================
// RECURRING INSTANCE BADGE - For virtual instances without full recurrence
// =================================================================

interface RecurringInstanceBadgeProps {
    className?: string;
}

export const RecurringInstanceBadge = memo(function RecurringInstanceBadge({
    className = '',
}: RecurringInstanceBadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1 px-1.5 py-0.5
                text-[10px] font-medium
                bg-accent-primary/10 text-accent-primary
                rounded-md
                ${className}
            `}
            title="Part of a recurring series"
        >
            <RepeatIcon className="w-3 h-3" />
            <span>Recurring</span>
        </span>
    );
});
