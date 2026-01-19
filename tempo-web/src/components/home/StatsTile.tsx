import { memo } from 'react';
import { motion } from 'framer-motion';
import { useStats } from '../../hooks/useStats';
import { LightningIcon } from '../icons';

interface StatsTileProps {
    onClick: () => void;
}

export const StatsTile = memo(function StatsTile({ onClick }: StatsTileProps) {
    const { currentStreak, completionRate } = useStats();

    return (
        <motion.div
            className="
                h-full w-full
                p-5 sm:p-6
                bg-bg-secondary/40 backdrop-blur-md
                border border-white/5
                rounded-3xl
                cursor-pointer
                group
                relative
                overflow-hidden
            "
            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* Background Gradient/Glow */}
            <div className={`
                absolute -right-10 -top-10 w-40 h-40 
                bg-accent-primary/5 rounded-full blur-3xl 
                transition-opacity duration-500
                ${currentStreak > 0 ? 'opacity-100' : 'opacity-0'}
            `} />

            <div className="relative flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                        <LightningIcon className="w-4 h-4" />
                        <span>Momentum</span>
                    </div>
                </div>

                {/* Main Stat: Streak */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight">
                            {currentStreak}
                        </span>
                        <span className="text-lg font-medium text-text-secondary">
                            days
                        </span>
                    </div>
                    <span className="text-xs text-text-muted">
                        Current Streak
                    </span>
                </div>

                {/* Secondary Stat: Weekly Activity */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                        <span className="text-2xl font-semibold text-text-primary block">
                            {completionRate.weekly}
                        </span>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                            Completed Last 7 Days
                        </span>
                    </div>

                    {/* Visual Flourish */}
                    <div className="p-2 rounded-full bg-bg-tertiary text-accent-primary opacity-50 group-hover:opacity-100 transition-opacity">
                        <LightningIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
