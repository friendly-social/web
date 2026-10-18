import {AppContext} from '@/app.context';
import {Resource} from '@/network/resource';
import {forceUnwrap} from '@/network/result';
import {
    useQuery,
    useQueries,
    queryOptions,
    useInfiniteQuery,
    infiniteQueryOptions,
} from '@tanstack/react-query';
import {useState, useEffect} from 'react';
import {
    ActivityId,
    ActivityNewUnreadsResponse,
} from '@/network/friendly-client';
import {ActivityDetails} from '@/network/friendly-client';
import {communityPosts} from '@/services/community-posts-service';

async function listQueryFn(app: AppContext, pageParam: string | null) {
    const result = forceUnwrap(
        await app.backend.activityList({cursorId: pageParam}),
    );
    const start = performance.now();
    await setDetails(app, result.data);
    console.log(`Saved activity list in ${performance.now() - start}`);
    return result;
}

function listOptions(app: AppContext) {
    return infiniteQueryOptions({
        queryKey: ['activity'],
        queryFn: async ({pageParam}) => listQueryFn(app, pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: lastPage => lastPage.nextId,
    });
}

function useCachedQuery(app: AppContext) {
    const [enabled, setEnabled] = useState(false);
    const query = useInfiniteQuery({
        ...listOptions(app),
        enabled,
    });

    useEffect(() => {
        const key = activity.listOptions(app).queryKey;
        const data = app.queryClient.getQueryData(key);
        if (!data) {
            setEnabled(true);
            return;
        }
        const firstId = data.pages[0].data[0]?.id;
        if (!firstId) {
            setEnabled(true);
            return;
        }
        let cancelled = false;
        void (async () => {
            const firstPage = await app.queryClient.fetchQuery({
                queryKey: [...key, 'refetch'],
                queryFn: () => listQueryFn(app, null),
            });
            if (cancelled) return;
            if (firstId !== firstPage.data[0]?.id) {
                app.queryClient.setQueryData(key, {
                    pages: [firstPage],
                    pageParams: [undefined],
                });
            }
            setEnabled(true);
        })();
        return () => {
            cancelled = true;
        };
    }, [app]);

    return query;
}

function detailsOptions(id: ActivityId) {
    return queryOptions<ActivityDetails>({
        queryKey: ['activityDetails', id],
        queryFn: async () => {
            throw new Error('Activity is cache-only');
        },
        enabled: false,
    });
}

async function setDetails(app: AppContext, values: ActivityDetails[]) {
    const posts = values
        .map(value => {
            switch (value.type) {
                case 'reply':
                    return [{type: 'plain' as const, ...value.post}];
                case 'indirect_replies':
                    return [
                        {type: 'plain' as const, ...value.post},
                        value.commonDenominator,
                    ];
                default:
                    value satisfies never;
                    return null;
            }
        })
        .filter(value => value !== null)
        .flat();
    await communityPosts.setPosts(app, posts);
    for (const value of values) {
        app.queryClient.setQueryData(
            detailsOptions(value.id).queryKey,
            oldData => ({
                ...value,
                isRead: oldData?.isRead || value.isRead,
            }),
        );
    }
}

function useDetails(id: ActivityId): Resource<ActivityDetails> {
    const query = useQuery(detailsOptions(id));
    return Resource.ofUseQuery(query);
}

function useManyDetails(ids: ActivityId[]): Resource<ActivityDetails>[] {
    const queries = useQueries({
        queries: ids.map(id => detailsOptions(id)),
    });
    return queries.map(query => Resource.ofUseQuery(query));
}

function useNewUnreads(app: AppContext): Resource<ActivityNewUnreadsResponse> {
    const query = useQuery({
        queryKey: ['activityNewUnreads'],
        queryFn: async () => {
            const result = await app.backend.activityNewUnreads();
            return forceUnwrap(result);
        },
    });
    return Resource.ofUseQuery(query);
}

export const activity = {
    listOptions,
    useCachedQuery,
    detailsOptions,
    setDetails,
    useDetails,
    useManyDetails,
    useNewUnreads,
};
