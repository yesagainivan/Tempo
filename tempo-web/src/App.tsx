import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { Button } from './components/ui';
import { Timeline } from './components/timeline';
import { motion } from 'framer-motion';

// =================================================================
// TEMPO APP SHELL
// =================================================================

function App() {
  const {
    view,
    setView,
    isCommandBarOpen,
    toggleCommandBar,
    focusDate
  } = useAppStore();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandBar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandBar]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <motion.h1
            className="text-xl font-semibold tracking-tight"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-accent-primary">Tempo</span>
          </motion.h1>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Button
              variant={view === 'timeline' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('timeline')}
            >
              Timeline
            </Button>
            <Button
              variant={view === 'today' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView('today')}
            >
              Today
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
      <main className={view === 'timeline' ? 'pt-16' : 'pt-20 px-6'}>
        {view === 'timeline' ? (
          <Timeline />
        ) : (
          <TodayPlaceholder focusDate={focusDate} />
        )}
      </main>

      {/* Command Bar Overlay (placeholder) */}
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
            className="relative w-full max-w-xl glass rounded-xl p-4 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
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
    </div>
  );
}

// =================================================================
// PLACEHOLDERS (to be replaced with real components)
// =================================================================

function TodayPlaceholder({ focusDate }: { focusDate: Date }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Today</h2>
        <p className="text-text-secondary mb-4">
          {focusDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <div className="glass rounded-xl p-8 mt-4">
          <p className="text-text-muted">Your Bento dashboard will appear here</p>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
