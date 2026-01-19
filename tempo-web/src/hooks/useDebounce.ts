import { useState, useEffect } from 'react';

/**
 * A standard hook for debouncing values.
 * Returns a debounced version of the passed value that only updates
 * after [delay] milliseconds have passed without the value changing.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
