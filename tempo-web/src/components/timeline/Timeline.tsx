import { useRef, useEffect, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { DayCard } from './DayCard';
import { indexToDate, dateToIndex } from '../../lib/dates';
import { useAppStore } from '../../stores/appStore';

// =================================================================
// INFINITE TIMELINE COMPONENT
// =================================================================

const OVERSCAN = 5;

// Virtual list total size (large enough for practical use)
const TOTAL_DAYS = 365 * 10; // 10 years total
const CENTER_INDEX = Math.floor(TOTAL_DAYS / 2);

export function Timeline() {
    const parentRef = useRef<HTMLDivElement>(null);
    const { focusDate, setFocusDate } = useAppStore();
    const [centerDate] = useState(() => new Date(focusDate));
    const [hasScrolledToToday, setHasScrolledToToday] = useState(false);
    const [currentVisibleDate, setCurrentVisibleDate] = useState<Date>(new Date());

    // Virtual list with dynamic sizing
    const virtualizer = useVirtualizer({
        count: TOTAL_DAYS,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 180, // Increased for new card design
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

    // Track visible date for header
    useEffect(() => {
        const items = virtualizer.getVirtualItems();
        if (items.length > 0) {
            const firstVisible = items[0];
            const date = indexToDate(firstVisible.index - CENTER_INDEX, centerDate);
            setCurrentVisibleDate(date);
        }
    }, [virtualizer.getVirtualItems(), centerDate]);

    // Convert virtual index to actual date
    const getDateForIndex = useCallback((virtualIndex: number): Date => {
        const dayOffset = virtualIndex - CENTER_INDEX;
        return indexToDate(dayOffset, centerDate);
    }, [centerDate]);

    // Handle adding a task
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
        <div className="relative h-[calc(100vh-4rem)]">
            {/* Timeline Header - Shows current month/year */}
            <motion.div
                className="sticky top-0 z-30 py-3 px-4 sm:px-8 lg:px-16"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="glass px-4 py-2 rounded-full">
                        <span className="text-sm font-medium text-text-primary">
                            {format(currentVisibleDate, 'MMMM yyyy')}
                        </span>
                    </div>

                    {/* Mini calendar icon (placeholder for future Calendar view) */}
                    <button className="glass px-3 py-2 rounded-full text-text-secondary hover:text-text-primary transition-colors">
                        <span className="text-sm">📅</span>
                    </button>
                </div>
            </motion.div>

            {/* Scroll Container */}
            <div
                ref={parentRef}
                className="h-full overflow-auto scrollbar-thin scroll-smooth"
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

            {/* Floating "Today" Button - More elegant */}
            <motion.button
                onClick={scrollToToday}
                className="
          fixed bottom-8 right-8 z-50
          px-5 py-3
          bg-gradient-to-r from-accent-primary to-accent-secondary
          text-white font-medium
          rounded-full
          shadow-xl shadow-accent-primary/25
          hover:shadow-2xl hover:shadow-accent-primary/40
          transition-shadow duration-300
        "
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
                <span className="flex items-center gap-2">
                    <span>⬇</span>
                    <span>Today</span>
                </span>
            </motion.button>

            {/* Timeline Progress Rail */}
            <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40">
                <div className="flex flex-col items-center gap-2">
                    {/* Month indicator dots */}
                    <div className="w-1.5 h-40 bg-bg-tertiary/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div
                            className="w-full bg-gradient-to-b from-accent-primary to-accent-secondary rounded-full"
                            style={{
                                height: `${Math.min(100, (virtualItems[0]?.index ?? 0) / TOTAL_DAYS * 100)}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
