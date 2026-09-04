import {QueryClient} from '@tanstack/react-query';
import {useQueryClient} from '@tanstack/react-query';
import {useAppContext} from '@/app.context';
import {
    PersistQueryClientProvider,
    PersistedClient,
    Persister,
} from '@tanstack/react-query-persist-client';
import {useMemo} from 'react';
import {get, set, del} from 'idb-keyval';
import {isRetriable} from '@/network/errors';
import {ReactNode} from 'react';

/**
 * Avoid local-storage limits.
 * @see https://github.com/TanStack/query/discussions/3198#discussion-3801221
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
    return {
        persistClient: async (client: PersistedClient) => {
            await set(idbValidKey, client);
        },
        restoreClient: async () => {
            return await get<PersistedClient>(idbValidKey);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
    } satisfies Persister;
}

export function QueryProvider({children}: {children: React.ReactNode}) {
    const client = useMemo(() => {
        const client = new QueryClient({
            defaultOptions: {
                queries: {
                    // Bounded on purpose: with endless retries a query never
                    // reaches its error state, so every "Retry" branch in the
                    // UI is dead code and an offline user only ever sees a
                    // spinner. `refetchOnReconnect` brings the data back once
                    // the network does.
                    retry: (failureCount, error) =>
                        failureCount < 3 && isRetriable(error),
                    retryDelay: attempt =>
                        Math.min(1_000 * 2 ** attempt, 30_000),
                    refetchOnWindowFocus: true,
                    refetchOnReconnect: true,
                    refetchOnMount: true,
                    staleTime: 1_000,
                    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
                },
            },
        });
        return client;
    }, []);

    const persister = useMemo(() => createIDBPersister(), []);

    return (
        <PersistQueryClientProvider
            client={client}
            persistOptions={{
                persister,
                buster: '3',
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            }}
        >
            <PopulateQueryClient />
            {children}
        </PersistQueryClientProvider>
    );
}

// WHY?
//
// Tanstack Query uses custom caching logic that breaks react double-pass
// system. Specifically tanstack caches query client if properties didn't
// change, but useMemo runs twice resulting in saving a queryClient that is
// rejected later.
//
// This logic lives under QueryClientProvider.ts
function PopulateQueryClient(): ReactNode {
    const client = useQueryClient();
    const app = useAppContext();
    app.queryClient = client;
    return;
}
