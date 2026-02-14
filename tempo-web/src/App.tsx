import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppStore } from './stores/appStore';
import { Home } from './components/home';
import { DayAgenda } from './components/calendar';
import { startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import { CommandBar } from './components/command-bar';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from './lib/db';
import { PowerSyncContext } from '@powersync/react';
import { db, setupPowerSync, connector } from './lib/db/powersync';
import { useAuthStore } from './stores/authStore';
import { AuthModal } from './components/auth/AuthModal';
import { TaskProvider } from './contexts/TaskProvider';
import type { ViewWindow } from './contexts/TaskContextDef';

// =================================================================
// TEMPO APP SHELL - Home Dashboard First
// =================================================================

type ViewMode = 'home' | 'day';

function App() {
  const { isCommandBarOpen, toggleCommandBar, closeCommandBar, setExpandedTaskId } = useAppStore();
  const { initialize: initAuth } = useAuthStore();
  const [dbReady, setDbReady] = useState(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Initialize DB and Auth
    const init = async () => {
      await setupPowerSync();
      await initAuth();
      setDbReady(true);
    };
    init();
  }, [initAuth]);

  // Connect PowerSync once after init - connector handles credentials dynamically
  useEffect(() => {
    if (dbReady) {
      db.connect(connector);
    }
  }, [dbReady]);

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Lifted Home State
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  // Centralized Window Logic
  // Optimization: Always use the Month Window (+/- 1 month)
  // This ensures that switching between Home and Day views does NOT trigger a re-query.
  // The Day view will simply consume from the already-loaded month data.
  const viewWindow: ViewWindow = useMemo(() => ({
    start: startOfMonth(subMonths(currentMonth, 1)),
    end: endOfMonth(addMonths(currentMonth, 1))
  }), [currentMonth]);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Navigation handlers
  const handleSelectDate = useCallback((date: Date) => {
    setExpandedTaskId(null); // Collapse any expanded task
    setSelectedDate(date);
    setViewMode('day');
  }, [setExpandedTaskId]);

  const handleBackToHome = useCallback(() => {
    setExpandedTaskId(null); // Collapse any expanded task
    console.log('Back to Home', currentMonth);
    setViewMode('home');
  }, [setExpandedTaskId, currentMonth]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);

    // If the new date is outside the currently visible month, update the calendar (and window)
    // This ensures that the user never "walks out" of the loaded data window.
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(startOfMonth(date));
    }
  }, [currentMonth]);

  // Command bar handlers
  const handleCreateTask = useCallback((_taskId: string, date: Date) => {
    // Navigate to the day where task was created
    setSelectedDate(date);
    // Ensure we load the data for that month
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(startOfMonth(date));
    }
    setViewMode('day');
  }, [currentMonth]);

  const handleJumpToDate = useCallback((date: Date) => {
    setSelectedDate(date);
    // Ensure we load the data for that month
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(startOfMonth(date));
    }
    setViewMode('day');
  }, [currentMonth]);

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

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          {/* Logo / Brand */}
          <h1 className="text-4xl font-bold tracking-tight text-text-primary">
            tempo
          </h1>

          {/* Subtle loading indicator */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-accent-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          <p className="text-sm text-text-muted mt-2 font-medium">
            Initializing Cloud...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <PowerSyncContext.Provider value={db}>
      <TaskProvider viewWindow={viewWindow}>
        <div className="min-h-screen bg-bg-primary text-text-primary">
          {/* Header */}
          <Header
            viewMode={viewMode}
            setViewMode={setViewMode}
            onHomeClick={handleBackToHome}
            toggleCommandBar={toggleCommandBar}
            openSettings={() => setIsSettingsOpen(true)}
          />

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
                  <Home
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                    onSelectDate={handleSelectDate}
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

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onOpenAuth={() => {
              setIsSettingsOpen(false);
              setIsAuthModalOpen(true);
            }}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        </div>
      </TaskProvider>
    </PowerSyncContext.Provider>
  );
}

export default App;
