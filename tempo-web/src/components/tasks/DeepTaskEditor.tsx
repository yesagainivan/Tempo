import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../lib/db';
import { updateTaskContent } from '../../lib/db';
import { toggleCheckbox } from '../../lib/markdown';
import { MarkdownRenderer } from './MarkdownRenderer';
import { PencilIcon, EyeIcon, ChevronUpIcon } from '../icons';

// =================================================================
// DEEP TASK EDITOR - Full editor for deep task markdown content
// =================================================================

interface DeepTaskEditorProps {
    task: Task;
    onCollapse: () => void;
}

// Smooth tween for expand/collapse (no spring to avoid stutter)
const expandTransition = {
    height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
    opacity: { duration: 0.2, ease: [0, 0, 0.2, 1] as const }
};

export const DeepTaskEditor = memo(function DeepTaskEditor({
    task,
    onCollapse
}: DeepTaskEditorProps) {
    const [content, setContent] = useState(task.content);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const saveTimeoutRef = useRef<number | null>(null);

    // Sync content when task changes
    useEffect(() => {
        setContent(task.content);
    }, [task.content]);

    // Autosave with debounce
    const saveContent = useCallback(async (newContent: string) => {
        if (newContent === task.content) return;

        setIsSaving(true);
        try {
            await updateTaskContent(task.id, newContent);
        } catch (error) {
            console.error('Failed to save content:', error);
        } finally {
            setIsSaving(false);
        }
    }, [task.id, task.content]);

    // Debounced save
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
            saveContent(content);
        }, 500);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [content, saveContent]);

    // Handle checkbox toggle in markdown
    const handleCheckboxToggle = useCallback((lineNumber: number) => {
        const newContent = toggleCheckbox(content, lineNumber);
        setContent(newContent);
    }, [content]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Escape to collapse (when not editing)
        if (e.key === 'Escape' && !isEditing) {
            onCollapse();
        }
        // Cmd+S to force save
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            saveContent(content);
        }
    }, [isEditing, onCollapse, saveContent, content]);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, []);

    useEffect(() => {
        if (isEditing) {
            adjustTextareaHeight();
        }
    }, [content, isEditing, adjustTextareaHeight]);

    // Stop propagation to prevent parent click handlers
    const handleEditorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
                ...expandTransition,
                layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
            }}
            className="overflow-hidden"
            onKeyDown={handleKeyDown}
            onClick={handleEditorClick}
        >
            {/* Inner container for padding - keeps animation smooth */}
            <motion.div
                className="mt-4 pt-4 border-t border-border-subtle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
            >
                {/* Editor Controls */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                                transition-all duration-200
                                ${isEditing
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                }
                            `}
                        >
                            {isEditing ? (
                                <>
                                    <EyeIcon className="w-3.5 h-3.5" />
                                    Preview
                                </>
                            ) : (
                                <>
                                    <PencilIcon className="w-3.5 h-3.5" />
                                    Edit
                                </>
                            )}
                        </button>
                        {isSaving && (
                            <span className="text-xs text-text-muted animate-pulse">
                                Saving...
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onCollapse}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
                    >
                        Collapse
                        <ChevronUpIcon className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Content Area - CSS transitions only, no Framer layout animations */}
                <div className="bg-bg-glass rounded-xl p-3 sm:p-5 min-h-[120px] relative">
                    {/* Editor Layer */}
                    <div
                        className={`
                            transition-opacity duration-150
                            ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-4'}
                        `}
                    >
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={adjustTextareaHeight}
                            placeholder="Write your notes in Markdown...

Examples:
# Heading
- [ ] Subtask one
- [x] Completed subtask
**bold** and *italic* text
`inline code`"
                            className="
                                w-full min-h-[100px] p-0
                                bg-transparent
                                text-sm text-text-primary
                                font-mono leading-relaxed
                                placeholder:text-text-muted/50
                                resize-none outline-none
                            "
                            autoFocus={isEditing}
                        />
                    </div>

                    {/* Preview Layer */}
                    <div
                        className={`
                            transition-opacity duration-150
                            ${!isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-4'}
                        `}
                    >
                        {content ? (
                            <MarkdownRenderer
                                content={content}
                                onCheckboxToggle={handleCheckboxToggle}
                            />
                        ) : (
                            <button
                                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                                onClick={() => setIsEditing(true)}
                            >
                                Click to add notes...
                            </button>
                        )}
                    </div>
                </div>

                {/* Keyboard Hints */}
                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-text-muted/70">
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">Esc</kbd> collapse
                    </span>
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">⌘S</kbd> save
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
});
