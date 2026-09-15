import {MainPostCard} from '@/app/community/replies/main-post';
import {CommunityPostDetails} from '@/network/friendly-client';
import {useLocation} from 'react-router';
import {useScaffoldContext} from '@/app/scaffold';
import {cn} from '@/lib/utils';
import {X} from 'lucide-react';
import {communityPosts} from '@/services/community-posts-service';
import {CommunityPostId} from '@/network/friendly-client';
import {CommunityDetailsResponse} from '@/network/friendly-client';
import {Button} from '@/components/ui/button';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Loader2, MessageCircle, AlertCircle} from 'lucide-react';
import {useTranslations} from 'use-intl';
import React, {useRef, useEffect, useLayoutEffect} from 'react';
import {useNavigate, useParams} from 'react-router';
import {CommunityPostCard} from '../post';
import {useAppContext} from '@/app.context';

export function RepliesPage() {
    const t = useTranslations('replies');
    const navigate = useNavigate();
    const app = useAppContext();

    const {id} = useParams();
    const idInt = id ? (Number(id) as CommunityPostId) : null;
    useEffect(() => {
        if (idInt === null || Number.isNaN(idInt)) {
            void navigate('/not-found');
        }
    }, [idInt]);
    if (!idInt) return;

    const replyTo = communityPosts.useDetails(app, idInt);

    const location = useLocation().state as {popDepth: number} | undefined;
    const popDepth = location?.popDepth ?? 0;

    function navigateUp() {
        if (popDepth) {
            void navigate(-popDepth);
        } else {
            void navigate('/community', {replace: true});
        }
    }

    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                navigateUp();
            }
        };
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, [navigateUp]);

    const {topBar} = useScaffoldContext();

    useLayoutEffect(() => {
        topBar.setCloseButton({
            onClick: navigateUp,
        });
        return () => {
            topBar.setCloseButton(null);
        };
    }, [location]);

    let content;

    if (replyTo.cache === 'empty') {
        content = (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    } else if (replyTo.cache !== 'ok') {
        content = (
            <div className="flex flex-col h-full gap-4 w-full items-center justify-center">
                <AlertCircle className="h-10 w-10 animate-pulse text-foreground/80" />
                <p className="text-center">{t('unknown_error')}</p>
                <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                        void communityPosts.invalidateDetails(app, idInt)
                    }
                >
                    {t('retry')}
                </Button>
            </div>
        );
    } else {
        content = (
            <ReplyContent
                id={idInt}
                replyTo={replyTo.data!}
                popDepth={popDepth + 1}
            />
        );
    }

    return (
        <div key={idInt} className="relative px-4 flex flex-col w-full h-full">
            {content}
            <div className="absolute flex justify-center top-0 left-0 right-0 pointer-events-none">
                <div className="w-full max-w-2xl ms-4 ms-14" />
                <Button
                    className={cn(
                        'h-10 w-10 mt-2 mx-2',
                        'cursor-pointer',
                        'hidden md:block',
                        'pointer-events-auto',
                    )}
                    onClick={navigateUp}
                    variant="ghost"
                >
                    <X className="w-full h-full" />
                </Button>
            </div>
        </div>
    );
}

interface ReplyContentProps {
    id: CommunityPostId;
    replyTo: CommunityDetailsResponse;
    popDepth: number;
}

function ReplyContent({id, replyTo, popDepth}: ReplyContentProps) {
    const app = useAppContext();
    const t = useTranslations('replies');

    replyTo = {
        ...replyTo,
        post: communityPosts.usePost(replyTo.post.id).data!,
    };

    const upstreamRef = useRef<HTMLDivElement>(null);
    const postRef = useRef<HTMLDivElement>(null);
    const scrollableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let shouldBreak = false;
        void (async () => {
            const replies = replyTo.replies.data.flatMap(reply => {
                switch (reply.type) {
                    case 'single':
                        return reply.post;
                    case 'thread':
                        return reply.thread;
                }
            });
            for (const reply of replies) {
                if (shouldBreak) break;
                await communityPosts.prefetchDetails(app, reply.id, {
                    staleTime: Infinity,
                });
            }
        })();
        void (async () => {
            for (const upstream of replyTo.upstream) {
                if (shouldBreak) break;
                await communityPosts.prefetchDetails(app, upstream.id, {
                    staleTime: Infinity,
                });
            }
        })();
        return () => {
            shouldBreak = true;
        };
    }, [replyTo]);

    useEffect(() => {
        const upstream = upstreamRef.current;
        if (upstream && replyTo.replies.data.length > 0) {
            upstream.scrollIntoView({
                behavior: 'instant',
                block: 'start',
                inline: 'nearest',
            });
        }
        const post = postRef.current;
        const scrollable = scrollableRef.current;
        if (post && scrollable && replyTo.replies.data.length === 0) {
            const fits =
                scrollable.getBoundingClientRect().height >=
                post.getBoundingClientRect().height;
            if (fits) {
                post.scrollIntoView({
                    behavior: 'instant',
                    block: 'end',
                    inline: 'nearest',
                });
            } else {
                post.scrollIntoView({
                    behavior: 'instant',
                    block: 'start',
                    inline: 'nearest',
                });
            }
        }
    }, [id]);

    const postsQuery = useInfiniteQuery({
        ...communityPosts.repliesOptions(app, replyTo.post),
    });

    const pages = postsQuery.data?.pages ?? [];
    const replies = pages.flatMap(p => p.data);

    const loadMore = () => {
        if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
            void postsQuery.fetchNextPage();
        }
    };

    const upstreamContent = (
        <>
            <div className="flex flex-col">
                {replyTo.upstream.length > 0 && (
                    <CommunityPostCard
                        key={replyTo.upstream[0].id}
                        className={cn(
                            'bg-card rounded-tl-xl rounded-tr-xl',
                            'border-t border-l border-r border-border',
                        )}
                        postId={replyTo.upstream[0].id}
                        minimizeToolbar={true}
                        popDepth={popDepth}
                    />
                )}
                {replyTo.upstream.length > 1 &&
                    replyTo.upstream
                        .slice(1)
                        .map(post => (
                            <CommunityPostCard
                                key={post.id}
                                className={cn(
                                    'bg-card',
                                    'border-t border-l border-r border-border',
                                )}
                                postId={post.id}
                                minimizeToolbar={true}
                                popDepth={popDepth}
                            />
                        ))}
                <div
                    ref={upstreamRef}
                    className="text-sm font-semibold uppercase text-foreground scroll-m-10"
                />
            </div>
        </>
    );

    let repliesContent;

    if (replies.length === 0) {
        repliesContent = (
            <div className="flex flex-col gap-2 mt-6 w-full items-center justify-center px-6 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground" />
                <p className="text-base font-semibold text-foreground">
                    {t('no-replies')}
                </p>
                <p className="max-w-xs text-sm text-muted-foreground">
                    {t('no-replies-desc')}
                </p>
                <div className="h-[50dvh] w-full" />
            </div>
        );
    } else {
        repliesContent = (
            <div className="w-full min-h-[70dvh] flex flex-col">
                <p className="text-sm font-semibold uppercase text-foreground pb-4">
                    {t('replies')}
                </p>
                {replies.map(reply => {
                    switch (reply.type) {
                        case 'single':
                            return (
                                <CommunityPostCard
                                    key={reply.post.id}
                                    className="mb-2 bg-card rounded-xl border border-border"
                                    postId={reply.post.id}
                                    minimizeToolbar={false}
                                    minimizeText={true}
                                    popDepth={popDepth}
                                />
                            );
                        case 'thread':
                            return (
                                <ThreadContent
                                    key={reply.thread[0].id}
                                    thread={reply.thread}
                                    popDepth={popDepth}
                                />
                            );
                    }
                })}
            </div>
        );
    }

    return (
        <div
            ref={scrollableRef}
            className="relative h-full w-full py-4 overflow-y-auto scrollbar-none"
        >
            <div className="w-full md:px-10">
                <div className="mx-auto h-full w-full max-w-2xl">
                    {upstreamContent}
                    <MainPostCard
                        first={replyTo.upstream.length === 0}
                        postRef={postRef}
                        details={replyTo}
                        popDepth={popDepth}
                    />
                    {repliesContent}
                    <div hidden={!postsQuery.hasNextPage}>
                        <Button
                            variant="ghost"
                            className="text-accent-foreground hover:cursor-pointer"
                            onClick={loadMore}
                            disabled={postsQuery.isFetchingNextPage}
                        >
                            {postsQuery.isFetchingNextPage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t('load-more')
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ThreadContentProps {
    thread: CommunityPostDetails[];
    popDepth: number;
}

function ThreadContent({thread, popDepth}: ThreadContentProps) {
    return (
        <>
            <CommunityPostCard
                key={thread[0].id}
                className={cn(
                    'bg-card rounded-tl-xl rounded-tr-xl',
                    'border border-border',
                )}
                postId={thread[0].id}
                minimizeToolbar={true}
                popDepth={popDepth}
            />
            {thread.length > 2 &&
                thread
                    .slice(1, -1)
                    .map(post => (
                        <CommunityPostCard
                            key={post.id}
                            className="bg-card border-l border-r border-b border-border"
                            postId={post.id}
                            minimizeToolbar={true}
                            popDepth={popDepth}
                        />
                    ))}
            <CommunityPostCard
                key={thread.at(-1)!.id}
                className={cn(
                    'bg-card rounded-bl-xl rounded-br-xl',
                    'border-b border-l border-r border-border',
                    'mb-2',
                )}
                postId={thread.at(-1)!.id}
                minimizeToolbar={false}
                popDepth={popDepth}
            />
        </>
    );
}
