import type {Metadata} from 'next';
import './globals.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {Suspense} from 'react';
import {RootContainer} from '@/components/root-container';

export const metadata: Metadata = {
    title: 'Friendly Web',
    description: 'Web client for Friendly',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta
                    name="viewport"
                    content="initial-scale=1, width=device-width"
                />
                <title>Friendly Web</title>
            </head>
            <body>
                <Suspense>
                    <RootContainer>{children}</RootContainer>
                </Suspense>
            </body>
        </html>
    );
}
