'use client';

import {createTheme, ThemeOptions, ThemeProvider} from '@mui/material/styles';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v13-appRouter';
import {CssBaseline} from '@mui/material';

// https://zenoo.github.io/mui-theme-creator/
const themeOptions: ThemeOptions = {
    colorSchemes: {
        light: true,
        dark: true,
    },
};

const theme = createTheme(themeOptions);

export function RootContainer({children}: {children: React.ReactNode}) {
    return (
        <AppRouterCacheProvider>
            <CssBaseline />
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </AppRouterCacheProvider>
    );
}
