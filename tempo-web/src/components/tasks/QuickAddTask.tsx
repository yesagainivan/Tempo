import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addTask } from '../../stores/appStore';

// =================================================================
// QUICK ADD TASK INPUT
// =================================================================

interface QuickAddTaskProps {
    date: Date;
    onComplete?: () => void;
    autoFocus?: boolean;
    placeholder?: string;
}

export const QuickAddTask = memo(function QuickAddTask({
    date,
    onComplete,
    autoFocus = false,
    placeholder = "What needs to be done?"
}: QuickAddTaskProps) {
    const [value, setValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus when specified
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const trimmedValue = value.trim();
        if (!trimmedValue || isSubmitting) return;

        setIsSubmitting(true);

        try {
            await addTask(trimmedValue, date, 'quick');
            setValue('');
            onComplete?.();
        } catch (error) {
            console.error('Failed to add task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            setValue('');
            inputRef.current?.blur();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative group">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={isSubmitting}
                    className="
            w-full py-3 px-4 pr-12
            bg-bg-tertiary/50
            border border-transparent
            rounded-xl
            text-sm text-text-primary
            placeholder:text-text-muted
            transition-all duration-200
            hover:bg-bg-tertiary
            focus:bg-bg-tertiary
            focus:border-accent-primary/50
            focus:outline-none focus:ring-2 focus:ring-accent-primary/20
            disabled:opacity-50
          "
                />

                {/* Submit Button */}
                <AnimatePresence>
                    {value.trim() && (
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            className="
                absolute right-2 top-1/2 -translate-y-1/2
                w-8 h-8
                flex items-center justify-center
                bg-accent-primary text-white
                rounded-lg
                hover:bg-accent-secondary
                transition-colors duration-200
                disabled:opacity-50
              "
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <span className="text-lg">↵</span>
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Keyboard Hint */}
            <p className="mt-2 text-xs text-text-muted opacity-0 group-focus-within:opacity-100 transition-opacity">
                Press <kbd className="px-1 py-0.5 bg-bg-tertiary rounded text-[10px]">Enter</kbd> to add ·
                <kbd className="px-1 py-0.5 bg-bg-tertiary rounded text-[10px] ml-1">Esc</kbd> to cancel
            </p>
        </form>
    );
});

// =================================================================
// INLINE TASK CREATOR (Expandable version for DayCard)
// =================================================================

interface InlineTaskCreatorProps {
    date: Date;
    isToday?: boolean;
}

export const InlineTaskCreator = memo(function InlineTaskCreator({
    date,
    isToday = false
}: InlineTaskCreatorProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isExpanded) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
            >
                <QuickAddTask
                    date={date}
                    autoFocus
                    onComplete={() => setIsExpanded(false)}
                    placeholder="Add a task..."
                />
            </motion.div>
        );
    }

    return (
        <motion.button
            onClick={() => setIsExpanded(true)}
            className={`
        w-full py-4 px-5
        text-sm
        border-2 border-dashed rounded-xl
        transition-all duration-200
        ${isToday
                    ? 'border-accent-primary/30 text-accent-primary/70 hover:border-accent-primary hover:text-accent-primary hover:bg-accent-primary/5'
                    : 'border-border-subtle text-text-muted hover:border-text-muted hover:text-text-secondary'
                }
      `}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <span className="flex items-center justify-center gap-2">
                <span className="text-lg">+</span>
                <span>Add task</span>
            </span>
        </motion.button>
    );
});
