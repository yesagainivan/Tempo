import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { XIcon, SunIcon, MoonIcon, MonitorIcon } from '../icons';
import { useThemeStore } from '../../stores/useThemeStore';
import type { ThemeMode } from '../../stores/useThemeStore';
import { Button } from '../ui/Button';
import { ColorPicker } from '../ui/ColorPicker';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAuth: () => void;
}

import { GithubIcon, LogOutIcon } from '../icons';
import { useAuthStore } from '../../stores/authStore';

const ACCENT_COLORS: { value: string; label: string }[] = [
    { value: '#7c5cff', label: 'Violet' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#f43f5e', label: 'Rose' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: MonitorIcon },
];

export function SettingsModal({ isOpen, onClose, onOpenAuth }: SettingsModalProps) {
    const { theme, accentColor, setTheme, setAccentColor } = useThemeStore();

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

                    {/* Dialog */}
                    <motion.div
                        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-bg-secondary border border-border-subtle shadow-card flex flex-col max-h-[85vh]"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-text-muted hover:text-text-primary rounded-lg transition-colors hover:bg-bg-tertiary"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Account Section */}
                            <AccountSection onOpenAuth={onOpenAuth} />

                            <hr className="border-border-subtle" />

                            {/* Theme Mode Section */}
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-base font-medium text-text-primary mb-1">Appearance</h3>
                                    <p className="text-sm text-text-secondary">Customize how Tempo looks on your device.</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {THEME_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setTheme(option.value)}
                                            className={`
                                                flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-200
                                                ${theme === option.value
                                                    ? 'bg-bg-tertiary border-accent-primary text-text-primary ring-1 ring-accent-primary'
                                                    : 'bg-bg-tertiary/50 border-border-subtle text-text-secondary hover:bg-bg-tertiary hover:border-border-default'
                                                }
                                            `}
                                        >
                                            <option.icon size={24} />
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <hr className="border-border-subtle" />

                            {/* Accent Color Section */}
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-base font-medium text-text-primary mb-1">Accent Color</h3>
                                    <p className="text-sm text-text-secondary">Choose the primary color for buttons, links, and highlights.</p>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    {/* Custom Color Picker */}
                                    <ColorPicker
                                        color={accentColor}
                                        onChange={setAccentColor}
                                    />
                                    {ACCENT_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setAccentColor(color.value)}
                                            className={`
                                                group relative w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105
                                                ring-2 ring-offset-2 ring-offset-bg-secondary
                                                ${accentColor === color.value
                                                    ? 'ring-accent-primary scale-110'
                                                    : 'ring-transparent hover:ring-border-default'
                                                }
                                            `}
                                            style={{ backgroundColor: color.value }}
                                            title={color.label}
                                        >
                                            {accentColor === color.value && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border-subtle bg-bg-tertiary/30">
                            <div className="flex justify-end">
                                <Button variant="primary" onClick={onClose}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function AccountSection({ onOpenAuth }: { onOpenAuth: () => void }) {
    const { user, signOut } = useAuthStore();

    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-base font-medium text-text-primary mb-1">Account</h3>
                <p className="text-sm text-text-secondary">
                    {user ? `Signed in as ${user.email}` : 'Sign in to sync your tasks across devices.'}
                </p>
            </div>

            {user ? (
                <Button variant="ghost" onClick={signOut} className="text-text-danger hover:text-text-danger hover:bg-bg-danger/10">
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            ) : (
                <Button variant="primary" onClick={onOpenAuth}>
                    <GithubIcon className="w-4 h-4 mr-2" />
                    Sign In with GitHub
                </Button>
            )}
        </section>
    );
}
