import {AppContext} from '@/app.context';
import {Resource} from '@/network/resource';
import {
    CommunityPostDescriptor,
    CommunityDetailsResponse,
} from '@/network/friendly-client';
import {forceUnwrap} from '@/network/result';
import {
    useQuery,
    queryOptions,
    useInfiniteQuery,
    infiniteQueryOptions,
} from '@tanstack/react-query';
import {useState, useEffect} from 'react';
import {CommunityPostId} from '@/network/friendly-client';
import {CommunityPostDetails} from '@/network/friendly-client';

function postOptions(id: CommunityPostId) {
    return queryOptions<CommunityPostDetails>({
        queryKey: ['post', id],
        queryFn: async () => {
            throw new Error('Post is cache-only');
        },
        enabled: false,
    });
}

function postDetailsOptions(app: AppContext, id: CommunityPostId) {
    return queryOptions({
        queryKey: ['postDetails', id],
        queryFn: async () => {
            const descriptor = await app.storage.communityPosts.get(id);
            const result = forceUnwrap(
                await app.backend.communityDetails2(descriptor),
            );
            await setPosts(app, [result.post]);
            await setPosts(
                app,
                result.replies.data.flatMap(reply => {
                    switch (reply.type) {
                        case 'single':
                            return reply.post;
                        case 'thread':
                            return reply.thread;
                    }
                }),
            );
            await setPosts(app, result.upstream);
            const cachedReplies = app.queryClient.getQueryData(
                repliesOptions(app, result.post).queryKey,
            );
            if (
                JSON.stringify(cachedReplies?.pages?.[0]?.data) !==
                JSON.stringify(result.replies.data)
            ) {
                app.queryClient.setQueryData(
                    repliesOptions(app, result.post).queryKey,
                    {
                        pages: [result.replies],
                        pageParams: [null],
                    },
                );
            }
            return result;
        },
    });
}

async function listQueryFn(app: AppContext, pageParam: string | null) {
    const result = forceUnwrap(
        await app.backend.communityList({cursorId: pageParam}),
    );
    await setPosts(
        app,
        result.data.map(post => ({
            type: 'plain',
            ...post,
        })),
    );
    return result;
}

function listOptions(app: AppContext) {
    return infiniteQueryOptions({
        queryKey: ['communityPosts'],
        queryFn: async ({pageParam}) => listQueryFn(app, pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: lastPage => lastPage.nextId,
    });
}

function repliesOptions(app: AppContext, descriptor: CommunityPostDescriptor) {
    return infiniteQueryOptions({
        queryKey: ['communityReplies', descriptor.id],
        queryFn: async ({pageParam}: {pageParam: string | null}) => {
            const result = forceUnwrap(
                await app.backend.communityReplies2({
                    id: descriptor.id,
                    accessHash: descriptor.accessHash,
                    cursorId: pageParam,
                }),
            );
            await setPosts(
                app,
                result.data.flatMap(reply => {
                    switch (reply.type) {
                        case 'single':
                            return reply.post;
                        case 'thread':
                            return reply.thread;
                    }
                }),
            );
            return result;
        },
        initialPageParam: null,
        getNextPageParam: lastPage => lastPage.nextId,
    });
}

function saveDescriptors(
    app: AppContext,
    descriptors: CommunityPostDescriptor[],
): Promise<void> {
    return app.storage.communityPosts.save(descriptors);
}

async function setDetails(app: AppContext, values: CommunityDetailsResponse[]) {
    for (const value of values) {
        app.queryClient.setQueryData(
            postDetailsOptions(app, value.post.id).queryKey,
            value,
        );
    }
    await setPosts(
        app,
        values.map(value => value.post),
    );
}

async function setPosts(app: AppContext, values: CommunityPostDetails[]) {
    await app.storage.communityPosts.save(values);
    for (const value of values) {
        app.queryClient.setQueryData(postOptions(value.id).queryKey, value);
    }
}

function useCachedQuery(app: AppContext) {
    const [enabled, setEnabled] = useState(false);
    const query = useInfiniteQuery({
        ...listOptions(app),
        enabled,
    });

    useEffect(() => {
        const key = listOptions(app).queryKey;
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
    }, []);

    return query;
}

function useDetails(
    app: AppContext,
    id: CommunityPostId,
): Resource<CommunityDetailsResponse> {
    const query = useQuery(postDetailsOptions(app, id));
    return Resource.ofUseQuery(query);
}

function usePost(id: CommunityPostId): Resource<CommunityPostDetails> {
    const query = useQuery(postOptions(id));
    return Resource.ofUseQuery(query);
}

function invalidateDetails(
    app: AppContext,
    id: CommunityPostId,
): Promise<void> {
    return app.queryClient.invalidateQueries(postDetailsOptions(app, id));
}

export interface PrefetchDetailsOptions {
    staleTime: number;
}

function prefetchDetails(
    app: AppContext,
    id: CommunityPostId,
    options?: PrefetchDetailsOptions,
): Promise<void> {
    return app.queryClient.prefetchQuery({
        ...postDetailsOptions(app, id),
        ...options,
    });
}

export interface PrefetchListOptions {
    staleTime: number;
}

function prefetchList(
    app: AppContext,
    options?: PrefetchListOptions,
): Promise<void> {
    return app.queryClient.prefetchInfiniteQuery({
        ...listOptions(app),
        ...options,
    });
}

export const communityPosts = {
    listOptions,
    repliesOptions,
    saveDescriptors,
    setDetails,
    setPosts,
    useCachedQuery,
    useDetails,
    usePost,
    invalidateDetails,
    prefetchDetails,
    prefetchList,
};
