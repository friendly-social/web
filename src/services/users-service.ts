import {Resource} from '@/network/resource';
import {UserDetailsResponse} from '@/network/friendly-client';
import {useEffect} from 'react';
import {useQuery, queryOptions} from '@tanstack/react-query';
import {AppContext} from '@/app.context';
import {err, forceUnwrap} from '@/network/result';
import {isRetryable, NetworkError} from '@/network/errors';
import {useSession} from '@/components/session-provider';

function selfOptions(app: AppContext) {
    return queryOptions({
        queryKey: ['self'],
        queryFn: async () => {
            const result = await app.backend.getUserDetails2();
            return forceUnwrap(result);
        },
    });
}

function userOptions(app: AppContext, id: number) {
    return queryOptions({
        queryKey: ['user', id],
        queryFn: async () => {
            const userPair = await app.storage.userAccessHashes.find(id);
            if (!userPair) {
                return forceUnwrap(
                    err({type: 'status', status: 404} satisfies NetworkError),
                );
            }
            const result = await app.backend.getUserDetailsById2(
                id,
                userPair.accessHash,
            );
            return forceUnwrap(result);
        },
        retry: (_failureCount, error) => isRetryable(error),
    });
}

export interface PrefetchDetailsOptions {
    staleTime: number;
}

function prefetchDetails(
    app: AppContext,
    id: number,
    options?: PrefetchDetailsOptions,
): Promise<void> {
    return app.queryClient.prefetchQuery({
        ...userOptions(app, id),
        ...options,
    });
}

function use(app: AppContext) {
    const session = useSession();
    useEffect(() => {
        if (session.status !== 'authed') return;
        void app.queryClient.invalidateQueries(selfOptions(app));
    }, [app, session.status]);
}

function self(app: AppContext): Resource<UserDetailsResponse> {
    const cache = app.queryClient
        .getQueryCache()
        .find({queryKey: selfOptions(app).queryKey});
    return Resource.ofQuery(cache?.state);
}

function ensureCachedSelf(app: AppContext): Promise<UserDetailsResponse> {
    return app.queryClient.ensureQueryData({
        ...selfOptions(app),
        retry: true,
    });
}

function ensureFreshSelf(app: AppContext): Promise<UserDetailsResponse> {
    return app.queryClient.fetchQuery({
        ...selfOptions(app),
        retry: true,
        staleTime: 0,
    });
}

function setSelf(app: AppContext, value?: UserDetailsResponse) {
    app.queryClient.setQueryData(selfOptions(app).queryKey, value);
}

function useSelf(app: AppContext): Resource<UserDetailsResponse> {
    const query = useQuery(selfOptions(app));
    return Resource.ofUseQuery(query);
}

export const users = {
    userOptions,
    prefetchDetails,
    use,
    self,
    setSelf,
    ensureCachedSelf,
    ensureFreshSelf,
    useSelf,
};
