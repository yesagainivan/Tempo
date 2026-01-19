import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor =
    | '#7c5cff' // Purple (Default)
    | '#3b82f6' // Blue
    | '#10b981' // Emerald
    | '#f43f5e' // Rose
    | '#f59e0b' // Amber
    | '#06b6d4'; // Cyan

interface ThemeState {
    theme: ThemeMode;
    accentColor: AccentColor;
    setTheme: (theme: ThemeMode) => void;
    setAccentColor: (color: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'dark',
            accentColor: '#7c5cff',
            setTheme: (theme) => set({ theme }),
            setAccentColor: (color) => set({ accentColor: color }),
        }),
        {
            name: 'tempo-theme-storage',
        }
    )
);
