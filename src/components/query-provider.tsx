import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import {useEffect, useRef, useState} from 'react';
import {useSession} from '@/components/session-provider';
import {isRetryableNetworkError} from '@/network/errors';

export function QueryProvider({children}: {children: React.ReactNode}) {
    const session = useSession();

    const sessionRef = useRef(session);

    useEffect(() => {
        sessionRef.current = session;
    }, [session]);

    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: (failureCount, error) =>
                            isRetryableNetworkError(error) && failureCount < 3,
                        retryDelay: attempt =>
                            Math.min(1_000 * 2 ** attempt, 10_000),
                        refetchOnWindowFocus: true,
                        refetchOnReconnect: true,
                        staleTime: 1000 * 60,
                    },
                },
                queryCache: new QueryCache({
                    // TODO:
                }),
                mutationCache: new MutationCache({
                    // TODO:
                }),
            }),
    );
    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}
