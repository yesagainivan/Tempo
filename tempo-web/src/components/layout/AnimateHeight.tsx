import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimateHeightProps {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
    transitionDuration?: number;
}

/**
 * A highly performant layout animator that strictly animates container height
 * in response to child content changes, completely bypassing Framer Motion's
 * heavy `layout` measuring engine which can cause layout thrashing on mobile.
 */
export function AnimateHeight({ children, className = '', innerClassName = '', transitionDuration = 0.2 }: AnimateHeightProps) {
    const [height, setHeight] = useState<number | 'auto'>('auto');
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            // We only have one entry, our measured container
            const observedHeight = entries[0].contentRect.height;
            setHeight(observedHeight);
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <motion.div
            className={className}
            style={{ overflow: isAnimating ? 'hidden' : 'visible' }}
            initial={false}
            animate={{ height }}
            transition={{ duration: transitionDuration, ease: 'easeOut' }}
            onAnimationStart={() => setIsAnimating(true)}
            onAnimationComplete={() => setIsAnimating(false)}
        >
            {/* The invisible measuring container that scales naturally with content */}
            <div ref={containerRef} className={`pb-[1px] ${innerClassName}`}>
                <AnimatePresence>
                    {children}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
