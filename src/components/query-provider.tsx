import {
    QueryClient,
    DehydratedState,
    dehydrate,
    hydrate,
    QueryClientProvider,
} from '@tanstack/react-query';
import {useQueryClient} from '@tanstack/react-query';
import {useAppContext} from '@/app.context';
import {useEffect, useState} from 'react';
import {get, set, del} from 'idb-keyval';
import {ReactNode} from 'react';

export function QueryProvider({children}: {children: React.ReactNode}) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: true,
                        retryDelay: 1_000,
                        refetchOnWindowFocus: true,
                        refetchOnReconnect: true,
                        refetchOnMount: true,
                        staleTime: 1_000,
                        networkMode: 'always',
                        gcTime: Infinity,
                    },
                },
            }),
    );

    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const abort = new AbortController();
        void runCustomPersister({
            client,
            setHydrated: () => setHydrated(true),
            buster: '5',
            abort: abort.signal,
        });
        return () => {
            abort.abort();
        };
    }, []);

    if (!hydrated) return;

    return (
        <QueryClientProvider client={client}>
            <PopulateQueryClient>{children}</PopulateQueryClient>
        </QueryClientProvider>
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
    // This is idempotent
    // eslint-disable-next-line react-hooks/immutability
    app.queryClient = client;
    return children;
}

interface CreateCustomPersisterProps {
    client: QueryClient;
    buster: string;
    abort: AbortSignal;
    setHydrated: () => void;
}

interface PersistedClient {
    state: DehydratedState;
    buster: string;
}

/**
 * Cannot use builtin persister as it is not optimized for high-frequency saves.
 */
async function runCustomPersister({
    client,
    buster,
    abort,
    setHydrated,
}: CreateCustomPersisterProps) {
    const key = 'reactQuery';
    const throttle = 5000;

    let lastSavedMillis = 0;
    let timeout: number | undefined;

    const restored = await get<PersistedClient>(key);
    if (abort.aborted) return;
    if (restored) {
        if (restored.buster !== buster) {
            await del(key);
        } else {
            hydrate(client, restored.state);
        }
    }
    if (abort.aborted) return;

    // Custom GC that doesn't use timeouts
    // (which are expensive at our cache scale)
    const week = 1000 * 60 * 60 * 24 * 7;
    client.removeQueries({
        predicate: query => Date.now() - query.state.dataUpdatedAt > week,
    });

    function onCacheChange() {
        if (timeout !== undefined) {
            return;
        }
        const elapsed = Date.now() - lastSavedMillis;
        if (elapsed >= throttle) {
            lastSavedMillis = Date.now();
            const state = dehydrate(client);
            void set(key, {
                state,
                buster,
            } satisfies PersistedClient);
            return;
        }
        timeout = window.setTimeout(() => {
            timeout = undefined;
            onCacheChange();
        }, throttle - elapsed);
    }
    const unsubscribe = client.getQueryCache().subscribe(onCacheChange);

    abort.onabort = () => {
        unsubscribe();
        if (timeout) {
            window.clearTimeout(timeout);
        }
    };

    setHydrated();
}
