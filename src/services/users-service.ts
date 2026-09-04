import {Resource} from '@/network/resource';
import {UserDetailsResponse} from '@/network/friendly-client';
import {useEffect} from 'react';
import {useQuery, queryOptions} from '@tanstack/react-query';
import {AppContext} from '@/app.context';
import {forceUnwrap} from '@/network/result';
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

function use(app: AppContext) {
    const session = useSession();
    useEffect(() => {
        if (session.status !== 'authed') return;
        void app.queryClient.prefetchQuery(selfOptions(app));
    }, [session.status]);
}

function self(app: AppContext): Resource<UserDetailsResponse> {
    const cache = app.queryClient
        .getQueryCache()
        .find({queryKey: selfOptions(app).queryKey});
    return Resource.ofQuery(cache?.state);
}

function ensureSelf(app: AppContext): Promise<UserDetailsResponse> {
    // No `retry` override here: this is awaited while creating a post, and an
    // endless retry means the submit button spins forever instead of the
    // mutation reporting the failure.
    return app.queryClient.ensureQueryData(selfOptions(app));
}

function setSelf(app: AppContext, value?: UserDetailsResponse) {
    app.queryClient.setQueryData(selfOptions(app).queryKey, value);
}

function useSelf(app: AppContext): Resource<UserDetailsResponse> {
    const query = useQuery(selfOptions(app));
    return Resource.ofUseQuery(query);
}

export const users = {
    use,
    self,
    setSelf,
    ensureSelf,
    useSelf,
};
