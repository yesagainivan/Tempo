import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@powersync/react';
import { type Task, type TaskType, saveTask } from '../../lib/db';
import { fuzzySearch } from '../../lib/search/fuzzySearch';
import { parseTaskInput, formatParsedDate } from '../../lib/nlp/dateParser';

// =================================================================
// TYPES
// =================================================================

export type CommandMode = 'search' | 'create' | 'goto' | 'help';

export interface CommandState {
    mode: CommandMode;
    parsedTitle?: string;
    parsedDate?: Date;
    parsedDateDisplay?: string;
    parsedRecurrence?: any;
}

export interface SearchResult {
    task: Task;
    highlights: { text: string; highlighted: boolean }[];
    score: number;
}

interface UseCommandBarProps {
    onCreateTask?: (taskId: string, date: Date) => void;
    onJumpToDate?: (date: Date) => void;
    onSelectTask?: (task: Task) => void;
    onClose: () => void;
}

// =================================================================
// HELPER: Row Mapper
// =================================================================

function rowToTask(row: any): Task {
    return {
        id: row.id,
        title: row.title,
        type: row.type as TaskType,
        content: row.content || '',
        dueDate: row.due_date,
        completed: row.completed === 1,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        order: row.order_key,
        recurrence: row.recurrence ? JSON.parse(row.recurrence) : undefined,
        recurringParentId: row.recurring_parent_id,
        isRecurringInstance: row.is_recurring_instance === 1,
    };
}

// =================================================================
// HOOK
// =================================================================

export function useCommandBar({
    onCreateTask,
    onJumpToDate,
    onSelectTask,
    onClose,
}: UseCommandBarProps) {
    const [input, setInput] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // 1. Fetch data for search
    // Optimize: fetch recent 200 tasks or all if dataset is small
    const { data: rows } = useQuery(
        `SELECT * FROM tasks ORDER BY created_at DESC LIMIT 500`
    );

    const tasks = useMemo(() => rows.map(rowToTask), [rows]);

    // 2. Parse State
    const commandState = useMemo<CommandState>(() => {
        const trimmed = input.trim();

        if (!trimmed) return { mode: 'search' };
        if (trimmed === '/help') return { mode: 'help' };
        if (trimmed === '/today') {
            return {
                mode: 'goto',
                parsedDate: new Date(),
                parsedDateDisplay: 'Today'
            };
        }

        // Explicit commands
        if (trimmed.startsWith('/go ')) {
            const dateStr = trimmed.slice(4);
            const parsed = parseTaskInput(dateStr); // Just use parser for date
            if (parsed.parsedDate) {
                return {
                    mode: 'goto',
                    parsedDate: parsed.parsedDate.date,
                    parsedDateDisplay: formatParsedDate(parsed.parsedDate)
                };
            }
            return { mode: 'goto' };
        }

        if (trimmed.startsWith('/task ')) {
            const taskStr = trimmed.slice(6);
            const parsed = parseTaskInput(taskStr);
            return {
                mode: 'create',
                parsedTitle: parsed.title,
                parsedDate: parsed.parsedDate?.date,
                parsedDateDisplay: parsed.parsedDate ? formatParsedDate(parsed.parsedDate) : undefined,
                parsedRecurrence: parsed.parsedRecurrence
            };
        }

        // Implicit parsing (Search vs Create logic)
        // If input contains ">", treat as quick create intent?
        // Or if simple search returns no results, maybe suggest create?
        // For now, stick to Search as default, but verify if input looks like a command.

        return { mode: 'search' };
    }, [input]);


    // 3. Search Results
    const searchResults = useMemo<SearchResult[]>(() => {
        if (commandState.mode !== 'search' || !input) return [];

        const matches = fuzzySearch(input, tasks, (t) => t.title, 20);

        return matches.map(m => ({
            task: m.item,
            score: m.match.score,
            highlights: [{ text: m.item.title, highlighted: false }] // Simplified, real highlighting needs utility
            // Real highlighting logic:
            // highlights: highlightMatches(m.item.title, m.match.indices)
        }));
    }, [input, tasks, commandState.mode]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchResults.length, commandState.mode]);


    // 4. Handlers

    const handleCreateTask = useCallback(async () => {
        if (!commandState.parsedTitle) return;

        const date = commandState.parsedDate || new Date();
        const newTask: Task = {
            id: crypto.randomUUID(),
            title: commandState.parsedTitle,
            type: 'quick',
            content: '',
            dueDate: date.getTime(),
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            order: Date.now(),
            // Recurrence not fully handled in type yet for passing to saveTask safely if complex
            // But basic structure is:
            recurrence: commandState.parsedRecurrence ? {
                pattern: commandState.parsedRecurrence.pattern,
                interval: commandState.parsedRecurrence.interval,
                daysOfWeek: commandState.parsedRecurrence.daysOfWeek,
            } : undefined
        };

        await saveTask(newTask);

        if (onCreateTask) {
            onCreateTask(newTask.id, date);
        }

        setInput('');
        onClose();
    }, [commandState, onCreateTask, onClose]);

    const handleJumpToDate = useCallback(() => {
        if (commandState.parsedDate && onJumpToDate) {
            onJumpToDate(commandState.parsedDate);
            setInput('');
            onClose();
        }
    }, [commandState, onJumpToDate, onClose]);

    const handleSelectTask = useCallback((task: Task) => {
        if (onSelectTask) {
            onSelectTask(task);
            setInput('');
            onClose();
        }
    }, [onSelectTask, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (commandState.mode === 'search') {
                setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandState.mode === 'search') {
                setSelectedIndex(i => Math.max(i - 1, 0));
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();

            if (commandState.mode === 'create') {
                handleCreateTask();
            } else if (commandState.mode === 'goto') {
                handleJumpToDate();
            } else if (commandState.mode === 'search') {
                if (searchResults.length > 0) {
                    handleSelectTask(searchResults[selectedIndex].task);
                } else {
                    // Enter on empty search -> maybe create?
                    // For now do nothing
                }
            }
        }
    }, [
        commandState.mode,
        searchResults,
        selectedIndex,
        handleCreateTask,
        handleJumpToDate,
        handleSelectTask
    ]);

    return {
        input,
        setInput,
        commandState,
        searchResults,
        selectedIndex,
        setSelectedIndex,
        handleKeyDown,
        handleCreateTask,
        handleJumpToDate,
        handleSelectTask
    };
}
