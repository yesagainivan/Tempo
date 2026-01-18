import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task, type Recurrence } from '../../lib/db';
import { addTask } from '../../stores/appStore';
import { parseTaskInput, formatParsedDate } from '../../lib/nlp/dateParser';
import { formatRecurrence } from '../../lib/db/recurrence';
import { fuzzySearch, highlightMatches } from '../../lib/search/fuzzySearch';
import type { CommandMode, CommandState, SearchResult } from './types';

// =================================================================
// COMMAND BAR HOOK
// =================================================================

interface UseCommandBarOptions {
    onCreateTask?: (taskId: string, date: Date) => void;
    onJumpToDate?: (date: Date) => void;
    onSelectTask?: (task: Task) => void;
    onClose?: () => void;
}

export function useCommandBar(options: UseCommandBarOptions) {
    const { onCreateTask, onJumpToDate, onSelectTask, onClose } = options;

    const [input, setInput] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Parse input to determine mode and extract data
    const commandState: CommandState = useMemo(() => {
        const trimmed = input.trim();

        // /task command - create new task
        // Matches "/task" or "/task something" but not "/tasks"
        const taskMatch = trimmed.match(/^\/task(?:\s+(.*)|$)/i);
        if (taskMatch) {
            const remainder = taskMatch[1] || ''; // Capture group 1 is the rest of string

            // Check for > delimiter (explicit title/date separation)
            const delimiterIndex = remainder.indexOf('>');

            let parsedTitle: string;
            let parsedDate: Date | undefined;
            let parsedDateDisplay: string | undefined;
            let parsedRecurrence: Recurrence | undefined;
            let hasTime = false;

            if (delimiterIndex !== -1) {
                // Explicit delimiter: "Buy milk > tomorrow"
                parsedTitle = remainder.slice(0, delimiterIndex).trim();
                const dateStr = remainder.slice(delimiterIndex + 1).trim();
                const parsed = parseTaskInput(dateStr);
                parsedDate = parsed.parsedDate?.date;
                parsedDateDisplay = parsed.parsedDate
                    ? formatParsedDate(parsed.parsedDate)
                    : undefined;
                hasTime = parsed.parsedDate?.hasTime || false;
                // Convert ParsedRecurrence to Recurrence
                if (parsed.parsedRecurrence) {
                    parsedRecurrence = {
                        pattern: parsed.parsedRecurrence.pattern,
                        interval: parsed.parsedRecurrence.interval,
                        daysOfWeek: parsed.parsedRecurrence.daysOfWeek,
                    };
                }
            } else {
                // No delimiter: try smart parsing from end
                const parsed = parseTaskInput(remainder);
                parsedTitle = parsed.title || remainder;
                parsedDate = parsed.parsedDate?.date;
                parsedDateDisplay = parsed.parsedDate
                    ? formatParsedDate(parsed.parsedDate)
                    : undefined;
                hasTime = parsed.parsedDate?.hasTime || false;
                // Convert ParsedRecurrence to Recurrence
                if (parsed.parsedRecurrence) {
                    parsedRecurrence = {
                        pattern: parsed.parsedRecurrence.pattern,
                        interval: parsed.parsedRecurrence.interval,
                        daysOfWeek: parsed.parsedRecurrence.daysOfWeek,
                    };
                }
            }

            // Build display with recurrence
            let displayParts: string[] = [];
            if (parsedDateDisplay) displayParts.push(parsedDateDisplay);
            if (parsedRecurrence) displayParts.push(formatRecurrence(parsedRecurrence));

            return {
                mode: 'create' as CommandMode,
                input: remainder,
                parsedTitle,
                parsedDate,
                parsedDateDisplay: displayParts.length > 0 ? displayParts.join(' • ') : undefined,
                parsedRecurrence,
                hasTime,
            };
        }

        // /go command - jump to date
        const goMatch = trimmed.match(/^\/go(?:\s+(.*)|$)/i);
        if (goMatch) {
            const remainder = goMatch[1] || '';
            const parsed = parseTaskInput(remainder);

            return {
                mode: 'goto' as CommandMode,
                input: remainder,
                parsedDate: parsed.parsedDate?.date,
                parsedDateDisplay: parsed.parsedDate
                    ? formatParsedDate(parsed.parsedDate)
                    : undefined,
            };
        }

        // /today shortcut
        if (trimmed.toLowerCase() === '/today') {
            return {
                mode: 'goto' as CommandMode,
                input: 'today',
                parsedDate: new Date(),
                parsedDateDisplay: 'Today',
            };
        }

        // /help or ?
        if (trimmed === '/help' || trimmed === '?') {
            return {
                mode: 'help' as CommandMode,
                input: trimmed,
            };
        }

        // Default: search mode
        return {
            mode: 'search' as CommandMode,
            input: trimmed,
        };
    }, [input]);

    // Fetch all tasks for search (limited query for performance)
    const allTasks = useLiveQuery(
        () => db.tasks.orderBy('createdAt').reverse().limit(100).toArray(),
        []
    );

    // Filter and rank search results
    const searchResults: SearchResult[] = useMemo(() => {
        if (commandState.mode !== 'search' || !commandState.input || !allTasks) {
            return [];
        }

        const matches = fuzzySearch(
            commandState.input,
            allTasks,
            (task) => task.title,
            8
        );

        return matches.map(({ item, match }) => ({
            task: item,
            highlights: highlightMatches(item.title, match.indices),
        }));
    }, [commandState.mode, commandState.input, allTasks]);

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchResults.length, commandState.mode]);

    // Handle creating a new task
    const handleCreateTask = useCallback(async () => {
        if (commandState.mode !== 'create' || !commandState.parsedTitle) {
            return;
        }

        const dueDate = commandState.parsedDate || new Date();
        const taskId = await addTask(
            commandState.parsedTitle,
            dueDate,
            'quick',
            '',
            commandState.parsedRecurrence
        );

        onCreateTask?.(taskId, dueDate);
        onClose?.();
        setInput('');
    }, [commandState, onCreateTask, onClose]);

    // Handle jumping to a date
    const handleJumpToDate = useCallback(() => {
        if (!commandState.parsedDate) {
            return;
        }

        onJumpToDate?.(commandState.parsedDate);
        onClose?.();
        setInput('');
    }, [commandState.parsedDate, onJumpToDate, onClose]);

    // Handle selecting a task from search
    const handleSelectTask = useCallback(
        (task: Task) => {
            onSelectTask?.(task);
            onClose?.();
            setInput('');
        },
        [onSelectTask, onClose]
    );

    // Handle keyboard selection
    const handleSelect = useCallback(() => {
        switch (commandState.mode) {
            case 'create':
                handleCreateTask();
                break;
            case 'goto':
                handleJumpToDate();
                break;
            case 'search':
                if (searchResults[selectedIndex]) {
                    handleSelectTask(searchResults[selectedIndex].task);
                }
                break;
        }
    }, [
        commandState.mode,
        handleCreateTask,
        handleJumpToDate,
        handleSelectTask,
        searchResults,
        selectedIndex,
    ]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (commandState.mode === 'search') {
                        setSelectedIndex((i) =>
                            Math.min(i + 1, searchResults.length - 1)
                        );
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (commandState.mode === 'search') {
                        setSelectedIndex((i) => Math.max(i - 1, 0));
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    handleSelect();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose?.();
                    break;
            }
        },
        [commandState.mode, searchResults.length, handleSelect, onClose]
    );

    return {
        input,
        setInput,
        commandState,
        searchResults,
        selectedIndex,
        setSelectedIndex,
        handleKeyDown,
        handleSelect,
        handleCreateTask,
        handleJumpToDate,
        handleSelectTask,
    };
}
