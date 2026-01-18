import { useRef, useEffect, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { DayCard } from './DayCard';
import { indexToDate, dateToIndex } from '../../lib/dates';
import { useAppStore } from '../../stores/appStore';

// =================================================================
// INFINITE TIMELINE COMPONENT
// =================================================================

const OVERSCAN = 5;

// Virtual list total size (large enough for practical use)
// Index 0 = center (initial focus date)
// Negative indices = past, Positive indices = future
const TOTAL_DAYS = 365 * 10; // 10 years total
const CENTER_INDEX = Math.floor(TOTAL_DAYS / 2);

export function Timeline() {
    const parentRef = useRef<HTMLDivElement>(null);
    const { focusDate, setFocusDate } = useAppStore();
    const [centerDate] = useState(() => new Date(focusDate));
    const [hasScrolledToToday, setHasScrolledToToday] = useState(false);

    // Virtual list with dynamic sizing
    const virtualizer = useVirtualizer({
        count: TOTAL_DAYS,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 150, // Estimated row height
        overscan: OVERSCAN,
    });

    // Scroll to today on mount
    useEffect(() => {
        if (!hasScrolledToToday && parentRef.current) {
            const todayIndex = CENTER_INDEX + dateToIndex(new Date(), centerDate);
            virtualizer.scrollToIndex(todayIndex, { align: 'start' });
            setHasScrolledToToday(true);
        }
    }, [virtualizer, hasScrolledToToday, centerDate]);

    // Convert virtual index to actual date
    const getDateForIndex = useCallback((virtualIndex: number): Date => {
        const dayOffset = virtualIndex - CENTER_INDEX;
        return indexToDate(dayOffset, centerDate);
    }, [centerDate]);

    // Handle adding a task (opens command bar with date context)
    const handleAddTask = useCallback((date: Date) => {
        setFocusDate(date);
        useAppStore.getState().openCommandBar();
    }, [setFocusDate]);

    // Jump to today
    const scrollToToday = useCallback(() => {
        const todayIndex = CENTER_INDEX + dateToIndex(new Date(), centerDate);
        virtualizer.scrollToIndex(todayIndex, { align: 'start', behavior: 'smooth' });
    }, [virtualizer, centerDate]);

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div className="relative h-[calc(100vh-5rem)]">
            {/* Scroll Container */}
            <div
                ref={parentRef}
                className="h-full overflow-auto scrollbar-thin"
            >
                {/* Virtual Content */}
                <div
                    className="relative w-full"
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                    }}
                >
                    {virtualItems.map((virtualRow) => {
                        const date = getDateForIndex(virtualRow.index);

                        return (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={virtualizer.measureElement}
                                className="absolute top-0 left-0 w-full"
                                style={{
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <DayCard
                                    date={date}
                                    onAddTask={handleAddTask}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating "Today" Button */}
            <motion.button
                onClick={scrollToToday}
                className="
          fixed bottom-6 right-6 z-50
          px-4 py-2
          bg-accent-primary text-white
          rounded-full shadow-lg
          hover:bg-accent-secondary
          transition-colors duration-200
        "
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                ↓ Today
            </motion.button>

            {/* Scroll Progress Indicator */}
            <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40">
                <div className="w-1 h-32 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                        className="w-full bg-accent-primary rounded-full"
                        style={{
                            height: `${Math.min(100, (virtualItems[0]?.index ?? 0) / TOTAL_DAYS * 100)}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
