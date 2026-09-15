import {
    useVirtualizer,
    VirtualItem,
    Virtualizer,
} from '@tanstack/react-virtual';
import {NavigationType, useNavigationType} from 'react-router';
import {useBackend} from '@/backend.context';
import {users} from '@/services/users-service';
import {useAppContext} from '@/app.context';
import {communityPosts} from '@/services/community-posts-service';
import {forceUnwrap} from '@/network/result';
import {Button} from '@/components/ui/button';
import {cn, createFileLink} from '@/lib/utils';
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {AlertCircle, Loader2, Newspaper, SquarePen, Trash} from 'lucide-react';
import {useTranslations} from 'use-intl';
import React, {
    ChangeEvent,
    ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {toast} from 'sonner';
import {newPost} from '@/services/new-post-service';
import {StyledAvatar} from '@/components/styled-avatar';
import {CommunityPostCard} from './post';
import {
    FriendsListContextMenu,
} from '@/components/ui/contextMenu/friends-list-contextmenu';
import {UserDetails} from '@/types/user-details';
import {CommunityPostEntity} from '@/network/friendly-client';

export function CommunityPage() {
    const t = useTranslations('community');
    const backend = useBackend();
    const queryClient = useQueryClient();
    const app = useAppContext();

    const [newPostText, setNewPostText] = newPost.useText();

    const postsQuery = useInfiniteQuery({
        queryKey: ['communityPosts'],
        queryFn: async ({pageParam}) => {
            const result = forceUnwrap(
                await backend.communityList({cursorId: pageParam}),
            );
            await communityPosts.setPosts(
                app,
                result.data.map(post => ({
                    type: 'plain',
                    ...post,
                })),
            );
            return result;
        },
        initialPageParam: null as string | null,
        getNextPageParam: lastPage => lastPage.nextId,
    });

    useEffect(() => {
        if (!postsQuery.data) return;
        let shouldBreak = false;
        void (async () => {
            for (const page of postsQuery.data.pages) {
                for (const post of page.data) {
                    if (shouldBreak) break;
                    await communityPosts.prefetchDetails(app, post.id, {
                        staleTime: Infinity,
                    });
                }
            }
        })();
        return () => {
            shouldBreak = true;
        };
    }, [postsQuery.data]);

    const createPostMutation = useMutation({
        mutationFn: async ({text, entities}: {
            text: string,
            entities: Map<number, MagicMention>
        }) => {
            // Later should be replaced with type-based parser
            const entitiesList = Array.from(entities, ([position, entity]) => ({
                type: entity.type,
                position: position,
                length: entity.plainText.length,
                target: `${entity.friend.id}:${entity.friend.accessHash}`,
            }))
            const result = await backend.communityPost({ text, entities: entitiesList });
            const details = {
                type: 'plain' as const,
                ...forceUnwrap(result),
                text,
                entities: entitiesList,
                owner: (await users.ensureSelf(app)).user,
                instant: new Date().toISOString(),
                replyPreviews: [],
                edited: false,
            };
            await communityPosts.setDetails(app, [
                {
                    post: details,
                    replies: {
                        data: [],
                        nextId: null,
                    },
                    upstream: [],
                },
            ]);
            await queryClient.invalidateQueries({
                queryKey: ['communityPosts'],
            });
            return details;
        },
        onSuccess: () => {
            setNewPostText('');
            virtualizer.scrollToOffset(0);
        },
        onError: error => {
            toast.error(error.message ?? t('post_create_error'));
        },
    });

    const handleCreatePost = useCallback((finalText: string, entities: Map<number, MagicMention>) => {
        if (!finalText.trim()) return;
        createPostMutation.mutate({
            text: finalText, entities
        });
    }, [createPostMutation]);

    const posts = useMemo(() => {
        const pages = postsQuery.data?.pages ?? [];
        return pages.flatMap(p => p.data);
    }, [postsQuery.data]);

    const items = [
        {
            key: 'create-post',
            Component: (
                <CreatePostCard
                    text={newPostText}
                    onTextChange={setNewPostText}
                    onSubmit={handleCreatePost}
                    isSubmitting={createPostMutation.isPending}
                />
            ),
        },
    ];

    const parentRef = useRef<HTMLDivElement | null>(null);

    items.push(
        ...posts.map(post => {
            return {
                isPost: true,
                key: post.id.toString(),
                Component: (
                    <CommunityPostCard
                        postId={post.id}
                        minimizeToolbar={false}
                        minimizeText={true}
                    />
                ),
            };
        }),
    );

    if (postsQuery.hasNextPage) {
        items.push({
            key: 'loader',
            Component: (
                <Loader onAppear={() => void postsQuery.fetchNextPage()} />
            ),
        });
    }

    const virtualizer = useListVirtualizer({items, parentRef});
    let content;

    if (postsQuery.isPending) {
        content = (
            <>
                <CreatePostCard
                    className="my-4"
                    text={newPostText}
                    onTextChange={setNewPostText}
                    onSubmit={handleCreatePost}
                    isSubmitting={createPostMutation.isPending}
                />
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
            </>
        );
    } else if (postsQuery.isError) {
        content = (
            <>
                <CreatePostCard
                    className="my-4"
                    text={newPostText}
                    onTextChange={setNewPostText}
                    onSubmit={handleCreatePost}
                    isSubmitting={createPostMutation.isPending}
                />
                <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                    <AlertCircle className="h-10 w-10 animate-pulse text-foreground/80" />
                    <p className="text-center">
                        {postsQuery.error?.message ?? t('unknown_error')}
                    </p>
                    <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => void postsQuery.refetch()}
                    >
                        {t('retry')}
                    </Button>
                </div>
            </>
        );
    } else {
        if (posts.length === 0) {
            content = (
                <>
                    <CreatePostCard
                        className="my-4"
                        text={newPostText}
                        onTextChange={setNewPostText}
                        onSubmit={handleCreatePost}
                        isSubmitting={createPostMutation.isPending}
                    />
                    <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center px-6 text-center">
                        <Newspaper className="w-12 h-12 text-muted-foreground" />
                        <p className="text-base font-semibold text-foreground">
                            {t('empty_title')}
                        </p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            {t('empty_desc')}
                        </p>
                    </div>
                </>
            );
        } else {
            content = (
                <List
                    virtualizer={virtualizer}
                    items={items}
                    parentRef={parentRef}
                />
            );
        }
    }

    return (
        <div className="flex flex-col items-center w-full h-full max-w-2xl mx-auto gap-4 px-4">
            {content}
        </div>
    );
}

interface CreatePostCardProps {
    text: string;
    className?: string;
    onTextChange: (text: string) => void;
    onSubmit: (text: string, entities: Map<number, MagicMention>) => void;
    isSubmitting: boolean;
}

interface MagicMention extends CommunityPostEntity {
    plainText: string;
    friend: UserDetails;
}

function CreatePostCard({
    text,
    className,
    onTextChange,
    onSubmit,
    isSubmitting,
}: CreatePostCardProps) {
    const t = useTranslations('community');
    const postRef = useRef<HTMLTextAreaElement>(null);
    const backend = useBackend();
    const userQuery = useQuery({
        queryKey: ['userDetails'],
        queryFn: async () => forceUnwrap(await backend.getUserDetails2()),
    });
    const networkQuery = useQuery({
        queryKey: ['networkDetails'],
        queryFn: async () => forceUnwrap(await backend.getNetworkDetails()),
    });
    const friends = networkQuery.data?.friends ?? [];

    const textTooLong = text.length > 4096;
    const showTextLength = text.length > 4000;
    const forbidSend = isSubmitting || !text.trim() || textTooLong;

    const avatarUrl = useMemo(
        () =>
            userQuery.data?.user?.avatar
                ? createFileLink(userQuery.data.user.avatar)
                : '',
        [userQuery],
    );

    //#region smartEdit
    const magicFragments = useRef<Map<number, MagicMention>>(new Map());
    const currentMagicIndex = useRef(0);
    const pendingCaret = useRef<number | null>(null);
    // Put the mention in entities block
    const handleSelect = (friend: UserDetails) => {
        setFriendsMenuOpen(false);
        magicFragments.current.set(currentMagicIndex.current - 1, {
            type: 'mention',
            plainText: '@' + friend.nickname,
            friend,
        });

        const start = currentMagicIndex.current - 1;
        const end = currentMagicIndex.current + friendsMenuFilterText.length;
        const mention = '@' + friend.nickname;
        pendingCaret.current = start + mention.length;
        onTextChange(text.slice(0, start) + mention + text.slice(end));
    };

    const [friendsMenuOpen, setFriendsMenuOpen] = useState(false);
    const [friendsMenuCoords, setFriendsMenuCoords] = useState({x: 0, y: 0});
    const [friendsMenuFilterText, setFriendsMenuFilterText] = useState('');

    const handleTextChange = useCallback((changeEvent: ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = changeEvent.target;
        const value = textarea.value;
        onTextChange(value);

        const caret = textarea.selectionStart ?? value.length;
        if (friendsMenuOpen) {
            if (currentMagicIndex.current > caret) {
                setFriendsMenuOpen(false);
                return;
            }
            setFriendsMenuFilterText(value.slice(currentMagicIndex.current, caret));
            return;
        }

        const isBoundary = (char: string | undefined) =>
            char === undefined || char === ' ';

        if (
            value[caret - 1] === '@' &&
            isBoundary(value[caret - 2]) &&
            isBoundary(value[caret]) &&
            magicFragments.current.size <= 10
        ) {
            const rect = textarea.getBoundingClientRect();
            setFriendsMenuCoords({x: rect.left, y: rect.bottom + 4});
            setFriendsMenuOpen(true);
            currentMagicIndex.current = caret;
            setFriendsMenuFilterText('');
        }
    }, [onTextChange, friendsMenuOpen]);
    //#endregion

    useEffect(() => {
        const post = postRef.current;
        if (post) {
            post.style.height = 'auto';
            post.style.height = `${post.scrollHeight}px`;
        }
        if (pendingCaret.current !== null && post) {
            post.focus();
            post.setSelectionRange(pendingCaret.current, pendingCaret.current);
            pendingCaret.current = null;
        }
    }, [text]);

    return (
        <div
            className={cn(
                'w-full bg-card rounded-xl border border-border p-4',
                className,
            )}
        >
            <div className="w-full flex gap-3">
                <StyledAvatar
                    avatarClassName="w-10 h-10"
                    src={avatarUrl}
                    nickname={userQuery?.data?.user?.nickname ?? ''}
                />
                <div className="w-full flex-1 flex flex-col min-w-0">
                    <textarea
                        ref={postRef}
                        className={cn(
                            'w-full mt-2',
                            'outline-none resize-none',
                        )}
                        value={text}
                        onChange={handleTextChange}
                        placeholder={t('placeholder')}
                    />
                    <div className="w-full flex items-center justify-end gap-1">
                        {showTextLength ? (
                            <div
                                className={cn(
                                    'text-xs mb-2',
                                    textTooLong ? 'text-destructive' : '',
                                )}
                            >
                                {text.length} / 4096
                            </div>
                        ) : undefined}
                        {text.length > 0 && (
                            <Button
                                onClick={() => onTextChange('')}
                                variant="ghost"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Trash />
                                    {t('clear-draft')}
                                </div>
                            </Button>
                        )}
                        <Button
                            onClick={() => forbidSend || onSubmit(text, magicFragments.current)}
                            disabled={forbidSend}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <SquarePen />
                                    {t('create_post')}
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
            <FriendsListContextMenu
                open={friendsMenuOpen}
                onOpenChange={setFriendsMenuOpen}
                coords={friendsMenuCoords}
                allFriendsList={friends}
                searchText={friendsMenuFilterText}
                handleSelect={handleSelect}
            />
        </div>
    );
}

interface LoaderProps {
    onAppear: () => void;
}

function Loader({onAppear}: LoaderProps) {
    useEffect(() => {
        onAppear();
    }, []);
    return <Loader2 className="h-4 w-4 animate-spin mx-auto" />;
}

interface Item {
    key: string;
    Component: ReactElement;
}

interface ScrollState {
    initialOffset: number;
    initialMeasurementsCache: VirtualItem[];
}

interface ListVirtualizerProps {
    items: Item[];
    parentRef: React.RefObject<HTMLDivElement | null>;
}

function useListVirtualizer({items, parentRef}: ListVirtualizerProps) {
    const navigationType = useNavigationType();
    const saved = useMemo(() => {
        if (navigationType !== NavigationType.Pop) {
            return null;
        }
        return JSON.parse(
            sessionStorage.getItem('activity.scroll') ?? 'null',
        ) as ScrollState;
    }, [navigationType]);

    return useVirtualizer({
        count: items.length,
        getItemKey: index => items[index].key,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 1000,
        overscan: 10,
        initialOffset: saved?.initialOffset,
        initialMeasurementsCache: saved?.initialMeasurementsCache,
        onChange: virtualizer => {
            if (virtualizer.isScrolling) return;
            sessionStorage.setItem(
                'activity.scroll',
                JSON.stringify({
                    initialOffset: virtualizer.scrollOffset,
                    initialMeasurementsCache: virtualizer.measurementsCache,
                }),
            );
        },
    });
}

interface ListProps {
    virtualizer: Virtualizer<HTMLDivElement, Element>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    items: Item[];
}

function List({virtualizer, parentRef, items}: ListProps) {
    return (
        <div
            ref={parentRef}
            className="w-full h-full overflow-y-auto scrollbar-none"
        >
            <div
                className="my-4"
                style={{
                    width: '100%',
                    height: `${virtualizer.getTotalSize()}px`,
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map(item => (
                    <div
                        key={item.key}
                        ref={virtualizer.measureElement}
                        data-index={item.index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            transform: `translateY(${item.start}px)`,
                            width: '100%',
                        }}
                    >
                        {items[item.index].Component}
                        <div className="h-4" />
                    </div>
                ))}
            </div>
        </div>
    );
}
