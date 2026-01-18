import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './stores/appStore';
import { Button } from './components/ui';
import { Home } from './components/home';
import { DayAgenda } from './components/calendar';
import { CommandBar } from './components/command-bar';
import { HomeIcon, ListIcon } from './components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from './lib/db';

// =================================================================
// TEMPO APP SHELL - Home Dashboard First
// =================================================================

type ViewMode = 'home' | 'day';

function App() {
  const { isCommandBarOpen, toggleCommandBar, closeCommandBar } = useAppStore();

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Navigation handlers
  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  }, []);

  const handleBackToHome = useCallback(() => {
    setViewMode('home');
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Command bar handlers
  const handleCreateTask = useCallback((_taskId: string, date: Date) => {
    // Navigate to the day where task was created
    setSelectedDate(date);
    setViewMode('day');
  }, []);

  const handleJumpToDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
  }, []);

  const handleSelectTask = useCallback((task: Task) => {
    // Navigate to the task's due date
    const date = new Date(task.dueDate);
    setSelectedDate(date);
    setViewMode('day');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandBar();
      }
      // Escape to go back to home (only if command bar is closed)
      if (e.key === 'Escape' && viewMode === 'day' && !isCommandBarOpen) {
        handleBackToHome();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandBar, viewMode, handleBackToHome, isCommandBarOpen]);

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
            onClick={handleBackToHome}
          >
            <span className="text-accent-primary">Tempo</span>
          </motion.h1>

          {/* View Toggle */}
          <nav className="flex items-center gap-2">
            <Button
              variant={viewMode === 'home' ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleBackToHome}
            >
              <HomeIcon className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button
              variant={viewMode === 'day' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              <ListIcon className="w-4 h-4 mr-2" /> Day
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
          {viewMode === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="pt-4"
            >
              <Home onSelectDate={handleSelectDate} />
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
                onBackToCalendar={handleBackToHome}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Command Bar */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={closeCommandBar}
        onCreateTask={handleCreateTask}
        onJumpToDate={handleJumpToDate}
        onSelectTask={handleSelectTask}
      />
    </div>
  );
}

export default App;
