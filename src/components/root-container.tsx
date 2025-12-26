'use client';

import {ThemeProvider} from '@/components/theme-provider';

export function RootContainer({children}: {children: React.ReactNode}) {
    return <ThemeProvider>{children}</ThemeProvider>;
}
