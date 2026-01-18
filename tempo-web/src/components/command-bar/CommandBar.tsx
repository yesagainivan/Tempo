import { useRef, useEffect } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useCommandBar } from './useCommandBar';
import type { Task } from '../../lib/db';

// =================================================================
// COMMAND BAR COMPONENT
// =================================================================

interface CommandBarProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTask?: (taskId: string, date: Date) => void;
    onJumpToDate?: (date: Date) => void;
    onSelectTask?: (task: Task) => void;
}

export function CommandBar({
    isOpen,
    onClose,
    onCreateTask,
    onJumpToDate,
    onSelectTask,
}: CommandBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        input,
        setInput,
        commandState,
        searchResults,
        selectedIndex,
        setSelectedIndex,
        handleKeyDown,
        handleCreateTask,
        handleJumpToDate,
        handleSelectTask,
    } = useCommandBar({
        onCreateTask,
        onJumpToDate,
        onSelectTask,
        onClose,
    });

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure modal is rendered
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Command Panel */}
                    <motion.div
                        className="command-bar relative w-full max-w-xl mx-4 overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    >
                        <Command
                            className="command-root"
                            onKeyDown={handleKeyDown}
                            loop
                        >
                            {/* Input */}
                            <div className="command-input-wrapper">
                                <ModeIcon mode={commandState.mode} />
                                <Command.Input
                                    ref={inputRef}
                                    value={input}
                                    onValueChange={setInput}
                                    placeholder="What would you like to do?"
                                    className="command-input"
                                />
                                <kbd className="command-shortcut">esc</kbd>
                            </div>

                            {/* Content */}
                            <Command.List className="command-list">
                                {/* Create Task Mode */}
                                {commandState.mode === 'create' && (
                                    commandState.parsedTitle ? (
                                        <CreateTaskPreview
                                            title={commandState.parsedTitle}
                                            dateDisplay={commandState.parsedDateDisplay}
                                            onConfirm={handleCreateTask}
                                        />
                                    ) : (
                                        <CreateTaskHint />
                                    )
                                )}

                                {/* Go To Date Mode */}
                                {commandState.mode === 'goto' && (
                                    commandState.parsedDate ? (
                                        <GoToDatePreview
                                            dateDisplay={commandState.parsedDateDisplay || ''}
                                            onConfirm={handleJumpToDate}
                                        />
                                    ) : (
                                        <GoToDateHint />
                                    )
                                )}

                                {/* Search Mode */}
                                {commandState.mode === 'search' && (
                                    <>
                                        {/* Empty state with hints */}
                                        {!input && (
                                            <CommandHints />
                                        )}

                                        {/* Search results */}
                                        {input && searchResults.length > 0 && (
                                            <Command.Group heading="Tasks">
                                                {searchResults.map((result, index) => (
                                                    <Command.Item
                                                        key={result.task.id}
                                                        value={result.task.title}
                                                        onSelect={() => handleSelectTask(result.task)}
                                                        className={`command-item ${index === selectedIndex ? 'selected' : ''
                                                            }`}
                                                        onMouseEnter={() => setSelectedIndex(index)}
                                                    >
                                                        <span className="command-item-icon">
                                                            {result.task.completed ? '✓' : '○'}
                                                        </span>
                                                        <div className="command-item-content">
                                                            <span className="command-item-title">
                                                                <HighlightedText segments={result.highlights} />
                                                            </span>
                                                            <span className="command-item-meta">
                                                                {format(result.task.dueDate, 'MMM d')}
                                                            </span>
                                                        </div>
                                                    </Command.Item>
                                                ))}
                                            </Command.Group>
                                        )}

                                        {/* No results */}
                                        {input && searchResults.length === 0 && (
                                            <Command.Empty className="command-empty">
                                                No tasks found for "{input}"
                                            </Command.Empty>
                                        )}
                                    </>
                                )}

                                {/* Help Mode */}
                                {commandState.mode === 'help' && (
                                    <HelpContent />
                                )}
                            </Command.List>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// =================================================================
// SUB-COMPONENTS
// =================================================================

function ModeIcon({ mode }: { mode: string }) {
    const icons: Record<string, string> = {
        search: '🔍',
        create: '✨',
        goto: '📅',
        help: '❓',
    };
    return <span className="command-mode-icon">{icons[mode] || '🔍'}</span>;
}

function CreateTaskPreview({
    title,
    dateDisplay,
    onConfirm,
}: {
    title: string;
    dateDisplay?: string;
    onConfirm: () => void;
}) {
    return (
        <div className="command-preview">
            <div className="command-preview-header">
                <span className="command-preview-icon">✨</span>
                <span>Create Task</span>
            </div>
            <div className="command-preview-body">
                <div className="command-preview-field">
                    <span className="command-preview-label">Title</span>
                    <span className="command-preview-value">{title || 'Enter a title...'}</span>
                </div>
                <div className="command-preview-field">
                    <span className="command-preview-label">Due</span>
                    <span className="command-preview-value">
                        {dateDisplay || 'Today (default)'}
                    </span>
                </div>
            </div>
            <div className="command-preview-footer">
                <button
                    onClick={onConfirm}
                    className="command-preview-action"
                    disabled={!title}
                >
                    <kbd>↵</kbd> Create task
                </button>
            </div>
        </div>
    );
}

function GoToDatePreview({
    dateDisplay,
    onConfirm,
}: {
    dateDisplay: string;
    onConfirm: () => void;
}) {
    return (
        <div className="command-preview">
            <div className="command-preview-header">
                <span className="command-preview-icon">📅</span>
                <span>Jump to Date</span>
            </div>
            <div className="command-preview-body">
                <div className="command-preview-field">
                    <span className="command-preview-label">Navigate to</span>
                    <span className="command-preview-value">{dateDisplay}</span>
                </div>
            </div>
            <div className="command-preview-footer">
                <button onClick={onConfirm} className="command-preview-action">
                    <kbd>↵</kbd> Go to date
                </button>
            </div>
        </div>
    );
}

function CreateTaskHint() {
    return (
        <div className="command-hints">
            <p className="command-hints-title">Create a task</p>
            <div className="command-hints-list">
                <div className="command-hint">
                    <code>Buy milk</code>
                    <span>Create "Buy milk" for today</span>
                </div>
                <div className="command-hint">
                    <code>Call mom &gt; tomorrow</code>
                    <span>Create "Call mom" for tomorrow</span>
                </div>
                <div className="command-hint">
                    <code>Meeting &gt; jan 25 3pm</code>
                    <span>Create "Meeting" for Jan 25 at 3pm</span>
                </div>
            </div>
        </div>
    );
}

function GoToDateHint() {
    return (
        <div className="command-hints">
            <p className="command-hints-title">Jump to a date</p>
            <div className="command-hints-list">
                <div className="command-hint">
                    <code>tomorrow</code>
                    <span>Go to tomorrow</span>
                </div>
                <div className="command-hint">
                    <code>next friday</code>
                    <span>Go to next Friday</span>
                </div>
                <div className="command-hint">
                    <code>jan 25</code>
                    <span>Go to January 25</span>
                </div>
            </div>
        </div>
    );
}

function CommandHints() {
    return (
        <div className="command-hints">
            <p className="command-hints-title">Quick commands</p>
            <div className="command-hints-list">
                <div className="command-hint">
                    <code>/task</code>
                    <span>Create a new task</span>
                </div>
                <div className="command-hint">
                    <code>/go</code>
                    <span>Jump to a date</span>
                </div>
                <div className="command-hint">
                    <code>/today</code>
                    <span>Go to today</span>
                </div>
            </div>
            <p className="command-hints-example">
                Tip: Use <code>&gt;</code> to separate title from date<br />
                <code>/task Meeting &gt; next friday 3pm</code>
            </p>
        </div>
    );
}

function HelpContent() {
    return (
        <div className="command-help">
            <h3>Command Bar Help</h3>
            <div className="command-help-section">
                <h4>Commands</h4>
                <ul>
                    <li><code>/task Title &gt; date</code> — Create a new task</li>
                    <li><code>/go [date]</code> — Jump to a date</li>
                    <li><code>/today</code> — Go to today</li>
                </ul>
            </div>
            <div className="command-help-section">
                <h4>Date formats</h4>
                <ul>
                    <li><code>today</code>, <code>tomorrow</code>, <code>yesterday</code></li>
                    <li><code>monday</code>, <code>next friday</code></li>
                    <li><code>jan 15</code>, <code>january 15th</code></li>
                    <li><code>in 3 days</code>, <code>next week</code></li>
                </ul>
            </div>
            <div className="command-help-section">
                <h4>Keyboard</h4>
                <ul>
                    <li><kbd>↑</kbd> <kbd>↓</kbd> — Navigate results</li>
                    <li><kbd>↵</kbd> — Select / Confirm</li>
                    <li><kbd>esc</kbd> — Close</li>
                </ul>
            </div>
        </div>
    );
}

function HighlightedText({
    segments,
}: {
    segments: { text: string; highlighted: boolean }[];
}) {
    return (
        <>
            {segments.map((segment, i) =>
                segment.highlighted ? (
                    <mark key={i} className="command-highlight">
                        {segment.text}
                    </mark>
                ) : (
                    <span key={i}>{segment.text}</span>
                )
            )}
        </>
    );
}
