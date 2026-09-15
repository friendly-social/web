import {QueryClient} from '@tanstack/react-query';
import {useQueryClient, useIsRestoring} from '@tanstack/react-query';
import {useAppContext} from '@/app.context';
import {
    PersistQueryClientProvider,
    PersistedClient,
    Persister,
} from '@tanstack/react-query-persist-client';
import {useMemo} from 'react';
import {get, set, del} from 'idb-keyval';
import {ReactNode} from 'react';

/**
 * Avoid local-storage limits.
 * @see https://github.com/TanStack/query/discussions/3198#discussion-3801221
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
    const throttle = 5000;

    let lastSavedMillis = 0;
    let lastKnownClient: PersistedClient;
    let timeout: number | undefined;

    function persistClient(client: PersistedClient) {
        lastKnownClient = client;
        if (timeout !== undefined) {
            return;
        }
        const elapsed = Date.now() - lastSavedMillis;
        if (elapsed >= throttle) {
            lastSavedMillis = Date.now();
            void set(idbValidKey, lastKnownClient);
            return;
        }
        timeout = window.setTimeout(() => {
            timeout = undefined;
            persistClient(lastKnownClient);
        }, throttle - elapsed);
    }

    return {
        persistClient: async (client: PersistedClient) => {
            persistClient(client);
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
                    retry: true,
                    retryDelay: 1_000,
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
                buster: '4',
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            }}
        >
            <PopulateQueryClient>{children}</PopulateQueryClient>
        </PersistQueryClientProvider>
    );
}

interface PopulateQueryClientProps {
    children: ReactNode;
}

// WHY?
//
// Tanstack Query uses custom caching logic that breaks react double-pass
// system. Specifically tanstack caches query client if properties didn't
// change, but useMemo runs twice resulting in saving a queryClient that is
// rejected later.
//
// This logic lives under QueryClientProvider.ts
function PopulateQueryClient({children}: PopulateQueryClientProps): ReactNode {
    const client = useQueryClient();
    const app = useAppContext();
    app.queryClient = client;
    const isRestoring = useIsRestoring();
    if (isRestoring) return;
    return children;
}
