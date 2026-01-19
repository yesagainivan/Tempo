import { motion } from 'framer-motion';
import { HomeIcon, ListIcon, SettingsIcon, SearchIcon } from '../icons';
import { Button } from '../ui';

interface HeaderProps {
    viewMode: 'home' | 'day';
    setViewMode: (mode: 'home' | 'day') => void;
    onHomeClick: () => void;
    toggleCommandBar: () => void;
    openSettings: () => void;
}

export function Header({
    viewMode,
    setViewMode,
    onHomeClick,
    toggleCommandBar,
    openSettings
}: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass h-16">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative">

                {/* Left: Logo */}
                <div className="flex-1 flex justify-start">
                    <motion.div
                        className="text-xl font-semibold tracking-tight cursor-pointer flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onHomeClick}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-accent-primary font-bold">Tempo</span>
                    </motion.div>
                </div>

                {/* Center: Navigation - Absolute Centered to ensure perfect symmetry */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <nav className="bg-bg-tertiary/50 p-1 rounded-xl flex items-center gap-1 border border-border-default/50">
                        <NavButton
                            isActive={viewMode === 'home'}
                            onClick={onHomeClick}
                            icon={HomeIcon}
                            label="Home"
                        />
                        <NavButton
                            isActive={viewMode === 'day'}
                            onClick={() => setViewMode('day')}
                            icon={ListIcon}
                            label="Day"
                        />
                    </nav>
                </div>

                {/* Right: Tools */}
                <div className="flex-1 flex justify-end items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleCommandBar}
                        className="h-9 px-3 bg-bg-tertiary/50 border-border-default/50 hover:bg-bg-tertiary hover:border-border-default text-text-secondary hover:text-text-primary transition-all group"
                    >
                        <div className="flex items-center gap-2">
                            <SearchIcon size={14} className="group-hover:text-accent-primary transition-colors" />
                            <span className="hidden sm:inline text-sm">Search</span>
                            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-bg-primary rounded border border-border-subtle font-mono text-text-muted">
                                ⌘K
                            </kbd>
                        </div>
                    </Button>

                    <div className="w-px h-6 bg-border-subtle mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={openSettings}
                        className="h-9 w-9 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                    >
                        <SettingsIcon size={18} />
                    </Button>
                </div>
            </div>
        </header>
    );
}

function NavButton({ isActive, onClick, icon: Icon, label }: { isActive: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 z-10
                ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}
            `}
        >
            {isActive && (
                <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-bg-primary shadow-sm border border-border-subtle rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
            <Icon size={14} className={isActive ? "text-accent-primary" : ""} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
