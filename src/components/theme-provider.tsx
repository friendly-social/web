import {createContext, useContext, useLayoutEffect, useState} from 'react';

type Theme = 'dark' | 'light';

interface ThemeProviderProps {
    children: React.ReactNode;
}

interface ThemeProviderState {
    theme: Theme;
}

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

// todo: when there's gonna be a theme-switcher in the app, ignore localStorage
//       value if in standalone mode and always show dark mode. Of course,
//       remove that setting from settings also. But ignore! Because local
//       storage values are shared between browser tab and PWA (in some
//       implementations)
export function ThemeProvider({children}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        darkModeQuery().matches ? 'dark' : 'light',
    );

    useLayoutEffect(() => {
        const darkMode = darkModeQuery();
        const onChange = () => setTheme(darkMode.matches ? 'dark' : 'light');
        darkMode.addEventListener('change', onChange);
        return () => darkMode.removeEventListener('change', onChange);
    }, []);

    const value = {
        theme,
    };

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === null)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};

// Since webmanifest was basically developed by script kiddies that don't know
// anything about flavoring and localization and theming, there's no theme
// support there in 2026 (at the time of writing this comment).
//
// So we only support dark mode in standalone mode.
function darkModeQuery(): MediaQueryList {
    return window.matchMedia(
        '(prefers-color-scheme: dark), (display-mode: standalone)',
    );
}
