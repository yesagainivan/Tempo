import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './stores/appStore';
import { Button } from './components/ui';
import { MonthCalendar, DayAgenda } from './components/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { addMonths, subMonths, startOfMonth } from 'date-fns';

// =================================================================
// TEMPO APP SHELL - Calendar First
// =================================================================

type ViewMode = 'calendar' | 'day';

function App() {
  const { isCommandBarOpen, toggleCommandBar } = useAppStore();

  // Calendar state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Navigation handlers
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  }, []);

  const handleBackToCalendar = useCallback(() => {
    setViewMode('calendar');
    // Ensure calendar shows the month of selected date
    setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(startOfMonth(date));
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandBar();
      }
      // Escape to go back to calendar
      if (e.key === 'Escape' && viewMode === 'day') {
        handleBackToCalendar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandBar, viewMode, handleBackToCalendar]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <motion.h1
            className="text-xl font-semibold tracking-tight cursor-pointer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleBackToCalendar}
          >
            <span className="text-accent-primary">Tempo</span>
          </motion.h1>

          {/* View Toggle */}
          <nav className="flex items-center gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleBackToCalendar}
            >
              📅 Calendar
            </Button>
            <Button
              variant={viewMode === 'day' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              📋 Day
            </Button>
          </nav>

          {/* Command Bar Trigger */}
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleCommandBar}
          >
            <span className="hidden sm:inline">Search</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-bg-tertiary rounded">
              ⌘K
            </kbd>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 px-4 sm:px-6 pb-8">
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pt-4"
            >
              <MonthCalendar
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onPrevMonth={goToPrevMonth}
                onNextMonth={goToNextMonth}
              />
            </motion.div>
          ) : (
            <motion.div
              key="day"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="pt-4"
            >
              <DayAgenda
                date={selectedDate}
                onDateChange={handleDateChange}
                onBackToCalendar={handleBackToCalendar}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Command Bar Overlay */}
      <AnimatePresence>
        {isCommandBarOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={toggleCommandBar}
            />
            <motion.div
              className="relative w-full max-w-xl mx-4 glass rounded-xl p-4 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <input
                autoFocus
                type="text"
                placeholder="What would you like to do?"
                className="w-full bg-transparent border-none outline-none text-lg text-text-primary placeholder:text-text-muted"
              />
              <p className="mt-4 text-sm text-text-muted">
                Try: /task Buy milk tomorrow
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
