import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useStats } from '../../hooks/useStats';
import { Heatmap } from './Heatmap';
import { LightningIcon, CheckCircleIcon, CalendarIcon } from '../icons';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StatsModal = memo(function StatsModal({ isOpen, onClose }: StatsModalProps) {
    const { currentStreak, longestStreak, totalCompleted, completionRate, heatmap } = useStats();

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        className="
                            relative w-full max-w-2xl 
                            bg-bg-secondary border border-border-subtle 
                            rounded-3xl shadow-2xl shadow-black/50
                            overflow-hidden
                            flex flex-col max-h-[85vh]
                        "
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header Area */}
                        <div className="p-6 sm:p-8 bg-bg-tertiary/30 border-b border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    <LightningIcon className="w-5 h-5 text-accent-primary" />
                                    Insights
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Top Stats Row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatBox
                                    label="Current Streak"
                                    value={currentStreak}
                                    suffix="days"
                                    icon={<LightningIcon className="w-4 h-4 text-warning" />}
                                />
                                <StatBox
                                    label="Longest Streak"
                                    value={longestStreak}
                                    suffix="days"
                                    icon={<LightningIcon className="w-4 h-4 text-text-muted" />}
                                />
                                <StatBox
                                    label="Total Completed"
                                    value={totalCompleted}
                                    icon={<CheckCircleIcon className="w-4 h-4 text-success" />}
                                />
                                <StatBox
                                    label="This Week"
                                    value={completionRate.weekly}
                                    suffix="tasks"
                                    icon={<CalendarIcon className="w-4 h-4 text-accent-primary" />}
                                />
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">

                            {/* Heatmap Section */}
                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-text-secondary mb-4 flex items-center gap-2">
                                    Activity Map
                                </h3>
                                <div className="p-4 bg-bg-tertiary/20 rounded-2xl border border-white/5">
                                    <Heatmap data={heatmap} />
                                </div>
                            </div>

                            {/* Motivation / Placeholder for Charts */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-accent-primary/10 to-accent-secondary/5 border border-accent-primary/10">
                                <p className="text-sm text-text-secondary italic text-center">
                                    "Consistency is not about perfection. It's about refusing to give up."
                                </p>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
});

function StatBox({ label, value, suffix, icon }: any) {
    return (
        <div className="p-3 rounded-xl bg-bg-primary/50 border border-white/5">
            <div className="flex items-center gap-2 mb-1 text-xs text-text-muted">
                {icon}
                <span>{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text-primary tabular-nums">
                    {value}
                </span>
                {suffix && <span className="text-xs text-text-muted">{suffix}</span>}
            </div>
        </div>
    );
}
