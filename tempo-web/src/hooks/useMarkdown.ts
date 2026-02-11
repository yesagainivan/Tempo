import { useMemo } from 'react';
import { processMarkdown } from '../lib/markdown';

/**
 * Hook for simple markdown to HTML conversion (memoized)
 */
export function useMarkdown(content: string): string {
    return useMemo(() => processMarkdown(content), [content]);
}
