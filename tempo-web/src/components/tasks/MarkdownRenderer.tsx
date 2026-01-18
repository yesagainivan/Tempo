import { memo, useEffect, useRef } from 'react';
import { processMarkdownWithCheckboxes } from '../../lib/markdown';

// =================================================================
// MARKDOWN RENDERER - Renders processed markdown with interactivity
// =================================================================

interface MarkdownRendererProps {
    content: string;
    onCheckboxToggle?: (lineNumber: number) => void;
    className?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
    content,
    onCheckboxToggle,
    className = ''
}: MarkdownRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Attach click handlers to checkboxes after render
    useEffect(() => {
        if (!containerRef.current || !onCheckboxToggle) return;

        const checkboxes = containerRef.current.querySelectorAll('input[type="checkbox"]');

        const handleClick = (e: Event) => {
            e.preventDefault();
            const target = e.target as HTMLInputElement;
            const lineNumber = parseInt(target.dataset.line || '-1', 10);
            if (lineNumber >= 0) {
                onCheckboxToggle(lineNumber);
            }
        };

        checkboxes.forEach(checkbox => {
            // Remove disabled attribute to make clickable
            checkbox.removeAttribute('disabled');
            checkbox.addEventListener('click', handleClick);
        });

        return () => {
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('click', handleClick);
            });
        };
    }, [content, onCheckboxToggle]);

    const html = processMarkdownWithCheckboxes(content);

    return (
        <div
            ref={containerRef}
            className={`markdown-content ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
});

// =================================================================
// HOOK: useMarkdown - For simple markdown to HTML conversion
// =================================================================

import { useMemo } from 'react';
import { processMarkdown } from '../../lib/markdown';

export function useMarkdown(content: string): string {
    return useMemo(() => processMarkdown(content), [content]);
}
