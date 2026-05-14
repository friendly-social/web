import type {Metadata} from 'next';
import './globals.css';
import {ReactNode, Suspense} from 'react';
import {Toaster} from '@/components/ui/sonner';
import {RootContainer} from '@/components/root-container';
import {BackendProvider} from '@/backend.context';
import {QueryProvider} from '@/components/query-provider';
import {SessionProvider} from '@/components/session-provider';
import {useLocale} from 'next-intl';
import IntlProvider from '@/components/intl-provider';

export const metadata: Metadata = {
    title: 'Friendly Web',
    description: 'Web client for Friendly',
    manifest: '/manifest.json',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const locale = useLocale();

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <meta
                    name="viewport"
                    content="initial-scale=1, width=device-width"
                />
                <link rel="manifest" href="manifest.json" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-title" content="Friendly" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <title>Friendly Web</title>
            </head>
            <body className="bg-[#fafafa]">
                <Suspense>
                    <BackendProvider>
                        <SessionProvider>
                            <QueryProvider>
                                <IntlProvider>
                                    <RootContainer>
                                        {children}
                                        <Toaster richColors />
                                    </RootContainer>
                                </IntlProvider>
                            </QueryProvider>
                        </SessionProvider>
                    </BackendProvider>
                </Suspense>
            </body>
        </html>
    );
}
