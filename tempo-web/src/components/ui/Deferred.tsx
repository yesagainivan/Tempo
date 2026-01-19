import { useState, useEffect, type ReactNode } from 'react';

interface DeferredProps {
    children: ReactNode;
    fallback?: ReactNode;
    delay?: number; // ms to Delay
}

/**
 * Defers the rendering of its children.
 * Useful for unblocking navigation animations by delaying heavy rendering
 * until after the main thread has cleared.
 */
export function Deferred({ children, fallback = null, delay = 0 }: DeferredProps) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Double RAF ensures we are at least one paint frame later
        // or usage of setTimeout for coarser control
        let timeoutId: number;

        const frameId = requestAnimationFrame(() => {
            timeoutId = window.setTimeout(() => {
                setIsReady(true);
            }, delay);
        });

        return () => {
            cancelAnimationFrame(frameId);
            clearTimeout(timeoutId);
        };
    }, [delay]);

    if (!isReady) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
