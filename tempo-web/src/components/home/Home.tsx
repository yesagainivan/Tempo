import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { addMonths, subMonths, startOfMonth } from 'date-fns';
import { CalendarTile } from './CalendarTile';
import { TodayTile } from './TodayTile';
import { UpcomingTile } from './UpcomingTile';

// =================================================================
// HOME DASHBOARD - Bento Grid Layout
// =================================================================

interface HomeProps {
    onSelectDate: (date: Date) => void;
}

export const Home = memo(function Home({ onSelectDate }: HomeProps) {
    const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState(() => new Date());

    const goToPrevMonth = useCallback(() => {
        setCurrentMonth(prev => subMonths(prev, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentMonth(prev => addMonths(prev, 1));
    }, []);

    const handleSelectDate = useCallback((date: Date) => {
        setSelectedDate(date);
        onSelectDate(date);
    }, [onSelectDate]);

    return (
        <motion.div
            className="w-full max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                {/* Calendar Tile - Takes ~35% on large screens */}
                <motion.div
                    className="lg:col-span-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <CalendarTile
                        currentMonth={currentMonth}
                        selectedDate={selectedDate}
                        onSelectDate={handleSelectDate}
                        onPrevMonth={goToPrevMonth}
                        onNextMonth={goToNextMonth}
                    />
                </motion.div>

                {/* Right Column - Tasks & Insights */}
                <div className="lg:col-span-8 space-y-4 lg:space-y-6">
                    {/* Today's Tasks */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <TodayTile onViewDay={() => handleSelectDate(new Date())} />
                    </motion.div>

                    {/* Upcoming Tasks */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <UpcomingTile onSelectDate={handleSelectDate} />
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
});
