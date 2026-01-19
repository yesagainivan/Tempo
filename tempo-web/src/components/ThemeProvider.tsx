import { useEffect } from 'react';
import { useThemeStore } from '../stores/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, accentColor } = useThemeStore();

    // Handle Theme Mode
    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';

            // Set dataset attribute for Tailwind/CSS selectors
            root.dataset.theme = systemTheme;
            root.classList.add(systemTheme);
            return;
        }

        root.dataset.theme = theme;
        root.classList.add(theme);
    }, [theme]);

    // Handle Accent Color
    useEffect(() => {
        const root = window.document.documentElement;

        // Convert hex to rgb for opacity handling if needed, 
        // but for now we'll just set the hex values directly
        root.style.setProperty('--color-accent-primary', accentColor);

        // We can generate secondary and glow colors based on the primary if we want,
        // but for simplicity let's do a simple mapping or just string manipulation if possible.
        // For now, I'll use a simple lighten/opacity approach if needed, 
        // but since we hardcoded hexes, let's just set the primary.
        // We really should calculate the secondary and glow.

        // Since we don't have a color manipulation library, we'll try to stick to just setting 
        // the primary color and using CSS `color-mix` or opacity where possible.

        // However, the original CSS has specific hex values for secondary and glow.
        // Let's try to derive them or just update the glow to use the same color with opacity.

        root.style.setProperty('--color-accent-glow', `${accentColor}4D`); // 30% alpha roughly, 4D is 30% of 255 (76 ~ 4D) - wait, 0.3 * 255 = 76.5 -> 4C/4D.

        // For secondary, we might just leave it or set it to the same color for now.
        // Or we can try to use `color-mix` in the CSS variable definition itself?
        // Let's set secondary to the same color but maybe slightly lighter?
        // Actually, let's just set it to the same color for now to ensure consistency,
        // or let CSS derive it if we switch the CSS to use color-mix.
        root.style.setProperty('--color-accent-secondary', accentColor);

    }, [accentColor]);

    return <>{children}</>;
}
