import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor = string;

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
