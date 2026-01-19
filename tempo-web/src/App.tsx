import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './stores/appStore';
import { Home } from './components/home';
import { DayAgenda } from './components/calendar';
import { CommandBar } from './components/command-bar';
import { Header } from './components/layout/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from './lib/db';
import { PowerSyncContext } from '@powersync/react';
import { db, setupPowerSync, connector } from './lib/db/powersync';
import { useAuthStore } from './stores/authStore';
import { AuthModal } from './components/auth/AuthModal';

// =================================================================
// TEMPO APP SHELL - Home Dashboard First
// =================================================================

type ViewMode = 'home' | 'day';

function App() {
  const { isCommandBarOpen, toggleCommandBar, closeCommandBar, setExpandedTaskId } = useAppStore();
  const { initialize: initAuth, session } = useAuthStore();
  const [dbReady, setDbReady] = useState(false);

  // Auth Modal State (controlled by user action or first time?)
  // For now, only manual trigger via Settings or logic
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Initialize DB and Auth
    const init = async () => {
      await setupPowerSync();
      await initAuth();
      setDbReady(true);
    };
    init();
  }, []);

  // Re-connect PowerSync when session changes
  useEffect(() => {
    if (dbReady) {
      // If session exists, we ensure we are connected with credentials
      // If session is null, we are in offline mode (or anonymous if allowed)
      // db.connect calls are idempotent-ish, but let's be safe
      if (session) {
        db.connect(connector);
      } else {
        // Optional: db.disconnect() if we want to stop syncing immediately on logout
        // But usually we want to keep local access. 
        // SupabaseConnector returns null credentials, so PowerSync might handle it.
        // Explicit disconnect might be cleaner for UI feedback ("Offline")
        // db.disconnect(); 
        // We'll leave it to maintain local functionality.
        db.connect(connector); // Re-connect to update credentials (to null)
      }
    }
  }, [session, dbReady]);

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

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
    setViewMode('home');
  }, [setExpandedTaskId]);

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

  if (!dbReady) {
    return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-primary">Initializing Tempo Cloud...</div>;
  }

  return (
    <PowerSyncContext.Provider value={db}>
      <div className="min-h-screen bg-bg-primary text-text-primary">
        {/* Header */}
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
    </PowerSyncContext.Provider>
  );
}

export default App;
