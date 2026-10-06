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
    use,
    self,
    setSelf,
    ensureCachedSelf,
    ensureFreshSelf,
    useSelf,
};
