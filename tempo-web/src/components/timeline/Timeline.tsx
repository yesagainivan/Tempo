import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { format, startOfDay, addDays } from 'date-fns';
import { DayCard } from './DayCard';

// =================================================================
// INFINITE TIMELINE COMPONENT
// =================================================================

const OVERSCAN = 5;
const ESTIMATED_ROW_HEIGHT = 180;

// Virtual list total size (large enough for practical use)
// We use 10 years: 5 years past, 5 years future
const YEARS_RANGE = 5;
const TOTAL_DAYS = 365 * YEARS_RANGE * 2; // ~10 years
const CENTER_INDEX = Math.floor(TOTAL_DAYS / 2);

// Calculate initial scroll offset to center on today
const INITIAL_SCROLL_OFFSET = CENTER_INDEX * ESTIMATED_ROW_HEIGHT;

export function Timeline() {
    const parentRef = useRef<HTMLDivElement>(null);
    const [currentVisibleDate, setCurrentVisibleDate] = useState<Date>(() => new Date());

    // CRITICAL: Today is ALWAYS the center point, calculated once on mount
    const today = useMemo(() => startOfDay(new Date()), []);

    // Virtual list with dynamic sizing and initial offset
    const virtualizer = useVirtualizer({
        count: TOTAL_DAYS,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ESTIMATED_ROW_HEIGHT,
        overscan: OVERSCAN,
        initialOffset: INITIAL_SCROLL_OFFSET, // Start at today!
    });

    // Convert virtual index to actual date
    // CENTER_INDEX = today, lower indices = past, higher = future
    const getDateForIndex = useCallback((virtualIndex: number): Date => {
        const dayOffset = virtualIndex - CENTER_INDEX;
        return addDays(today, dayOffset);
    }, [today]);

    // Track visible date for header
    useEffect(() => {
        const items = virtualizer.getVirtualItems();
        if (items.length > 0) {
            const firstVisible = items[0];
            const date = getDateForIndex(firstVisible.index);
            setCurrentVisibleDate(date);
        }
    }, [virtualizer.getVirtualItems(), getDateForIndex]);

    // Jump to today
    const scrollToToday = useCallback(() => {
        // Calculate scroll position for today (CENTER_INDEX)
        const scrollOffset = CENTER_INDEX * ESTIMATED_ROW_HEIGHT;
        parentRef.current?.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    }, []);

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
                                <DayCard date={date} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating "Today" Button */}
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
