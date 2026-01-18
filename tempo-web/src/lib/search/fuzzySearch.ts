// =================================================================
// FUZZY SEARCH UTILITY
// =================================================================

export interface FuzzyMatch {
    item: string;
    score: number;
    indices: [number, number][]; // Start/end pairs for matched regions
}

/**
 * Calculate fuzzy match score between query and target
 * Returns null if no match, otherwise returns score and match indices
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
    const queryLower = query.toLowerCase();
    const targetLower = target.toLowerCase();

    if (!queryLower) {
        return { item: target, score: 0, indices: [] };
    }

    let score = 0;
    let queryIdx = 0;
    let matchStart = -1;
    let lastMatchIdx = -1;
    const indices: [number, number][] = [];

    for (let i = 0; i < targetLower.length && queryIdx < queryLower.length; i++) {
        if (targetLower[i] === queryLower[queryIdx]) {
            // Start of new match region
            if (matchStart === -1) {
                matchStart = i;
            }

            // Consecutive match bonus
            if (lastMatchIdx === i - 1) {
                score += 5;
            }

            // Word start bonus (after space or at beginning)
            if (i === 0 || target[i - 1] === ' ') {
                score += 10;
            }

            // Exact position bonus (early matches are better)
            score += Math.max(0, 10 - i);

            lastMatchIdx = i;
            queryIdx++;
        } else if (matchStart !== -1) {
            // End of match region
            indices.push([matchStart, lastMatchIdx]);
            matchStart = -1;
        }
    }

    // Close final match region
    if (matchStart !== -1) {
        indices.push([matchStart, lastMatchIdx]);
    }

    // All query characters must be matched
    if (queryIdx !== queryLower.length) {
        return null;
    }

    // Bonus for shorter targets (more relevant)
    score += Math.max(0, 20 - target.length);

    // Bonus for matching at start
    if (targetLower.startsWith(queryLower)) {
        score += 50;
    }

    return { item: target, score, indices };
}

/**
 * Search through items and return sorted matches
 */
export function fuzzySearch<T>(
    query: string,
    items: T[],
    getSearchText: (item: T) => string,
    limit = 10
): { item: T; match: FuzzyMatch }[] {
    const results: { item: T; match: FuzzyMatch }[] = [];

    for (const item of items) {
        const text = getSearchText(item);
        const match = fuzzyMatch(query, text);

        if (match) {
            results.push({ item, match });
        }
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.match.score - a.match.score);

    return results.slice(0, limit);
}

/**
 * Highlight matched portions of text
 * Returns an array of { text, highlighted } segments
 */
export function highlightMatches(
    text: string,
    indices: [number, number][]
): { text: string; highlighted: boolean }[] {
    if (indices.length === 0) {
        return [{ text, highlighted: false }];
    }

    const segments: { text: string; highlighted: boolean }[] = [];
    let lastEnd = 0;

    for (const [start, end] of indices) {
        // Non-highlighted portion before this match
        if (start > lastEnd) {
            segments.push({
                text: text.slice(lastEnd, start),
                highlighted: false,
            });
        }

        // Highlighted match
        segments.push({
            text: text.slice(start, end + 1),
            highlighted: true,
        });

        lastEnd = end + 1;
    }

    // Remaining non-highlighted portion
    if (lastEnd < text.length) {
        segments.push({
            text: text.slice(lastEnd),
            highlighted: false,
        });
    }

    return segments;
}
