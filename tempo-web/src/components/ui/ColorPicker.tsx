import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaletteIcon, CheckIcon } from '../icons';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    label?: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempColor, setTempColor] = useState(color);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync temp color when prop changes
    useEffect(() => {
        setTempColor(color);
    }, [color]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const presetColors = [
        '#7c5cff', // Violet
        '#3b82f6', // Blue
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#84cc16', // Lime
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#f43f5e', // Rose
        '#d946ef', // Fuchsia
        '#8b5cf6', // Indigo
    ];

    const handleApply = () => {
        if (/^#[0-9A-F]{6}$/i.test(tempColor)) {
            onChange(tempColor);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <div className="flex flex-col gap-1.5">
                {label && <span className="text-xs text-text-muted font-medium">{label}</span>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        group flex items-center gap-3 px-3 py-2 rounded-xl
                        bg-bg-tertiary border border-border-subtle
                        hover:border-border-default transition-all duration-200
                        ${isOpen ? 'ring-1 ring-accent-primary border-accent-primary' : ''}
                    `}
                >
                    <div
                        className="w-6 h-6 rounded-full shadow-sm border border-white/10"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-mono text-text-primary uppercase flex-1 text-left">
                        {color}
                    </span>
                    <PaletteIcon className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                </button>
            </div>

            {/* Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full left-0 mt-2 z-50 w-64 p-4 rounded-xl bg-bg-secondary border border-border-default shadow-card"
                    >
                        <div className="space-y-4">
                            {/* Hex Input */}
                            <div>
                                <label className="text-xs text-text-muted mb-1.5 block">Hex Code</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted select-none">#</span>
                                        <input
                                            type="text"
                                            value={tempColor.replace('#', '')}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9A-F]/gi, '').slice(0, 6);
                                                setTempColor(`#${val}`);
                                            }}
                                            className="
                                                w-full pl-7 pr-3 py-1.5 rounded-lg
                                                bg-bg-tertiary border border-border-subtle
                                                text-sm font-mono text-text-primary
                                                focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
                                            "
                                        />
                                    </div>
                                    <div
                                        className="w-9 h-9 rounded-lg border border-border-subtle"
                                        style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(tempColor) ? tempColor : 'transparent' }}
                                    />
                                </div>
                            </div>

                            {/* Presets */}
                            <div>
                                <label className="text-xs text-text-muted mb-1.5 block">Presets</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {presetColors.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setTempColor(c)}
                                            className={`
                                                w-8 h-8 rounded-full border border-transparent hover:scale-110 transition-transform
                                                ${tempColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-secondary' : ''}
                                            `}
                                            style={{ backgroundColor: c }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => {
                                        setTempColor(color);
                                        setIsOpen(false);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApply}
                                    disabled={!/^#[0-9A-F]{6}$/i.test(tempColor)}
                                    className="
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                        bg-accent-primary text-white text-xs font-medium
                                        hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-colors
                                    "
                                >
                                    <CheckIcon className="w-3.5 h-3.5" />
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
