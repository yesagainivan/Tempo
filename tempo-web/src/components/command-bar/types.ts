import type { Task, Recurrence } from '../../lib/db';

// =================================================================
// COMMAND BAR TYPES
// =================================================================

export type CommandMode = 'search' | 'create' | 'goto' | 'help';

export interface CommandState {
    mode: CommandMode;
    input: string;
    parsedTitle?: string;
    parsedDate?: Date;
    parsedDateDisplay?: string;
    parsedRecurrence?: Recurrence;
    hasTime?: boolean;
}

export interface SearchResult {
    task: Task;
    highlights: { text: string; highlighted: boolean }[];
}

export interface CommandAction {
    id: string;
    label: string;
    description?: string;
    icon: string;
    shortcut?: string;
    onSelect: () => void;
}
