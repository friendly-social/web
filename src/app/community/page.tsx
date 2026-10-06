import {AdjusterPayload, Adjuster, AdjusterCrop} from '@/components/adjuster';
import {MarkdownArea} from '@/components/ui/markdown-area';
import {useImagePreviewerController} from '@/components/image-previewer';
import {newPost} from '@/services/new-post-service';
import {isMobile} from '@/lib/is-mobile';
import {
    useVirtualizer,
    VirtualItem,
    Virtualizer,
} from '@tanstack/react-virtual';
import {resizeImage} from '@/network/image';
import {VisitTip} from '@/app/tips/visit-tip';
import {useNavigationType, NavigationType} from 'react-router';
import {useBackend} from '@/backend.context';
import {users} from '@/services/users-service';
import {useAppContext} from '@/app.context';
import {communityPosts} from '@/services/community-posts-service';
import {forceUnwrap} from '@/network/result';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {useMutation, useQuery} from '@tanstack/react-query';
import {
    Loader2,
    AlertCircle,
    SquarePen,
    Newspaper,
    Trash,
    Eye,
    Pen,
    Paperclip,
} from 'lucide-react';
import {useTranslations} from 'use-intl';
import React, {ReactElement, useMemo, useRef, useEffect, useState} from 'react';
import {toast} from 'sonner';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';
import {CommunityPostCard} from './post';

export function CommunityPage() {
    const t = useTranslations('community');
    const app = useAppContext();

    const postsQuery = communityPosts.useCachedQuery(app);

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

    const posts = useMemo(() => {
        const pages = postsQuery.data?.pages ?? [];
        return pages.flatMap(p => p.data);
    }, [postsQuery.data]);

    const items = [
        {
            key: 'create-post',
            Component: <CreatePostCard onPostCreated={onPostCreated} />,
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
                        className="bg-card rounded-xl border border-border"
                        postId={post.id}
                        minimizeToolbar={false}
                        minimizeText={true}
                        popDepth={1}
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

    function onPostCreated() {
        virtualizer.scrollToOffset(0);
    }

    let content;

    if (postsQuery.isPending) {
        content = (
            <div className="h-full w-full flex flex-col max-w-2xl">
                <CreatePostCard
                    className="my-4"
                    onPostCreated={onPostCreated}
                />
                <div className="flex flex-1 w-full items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    } else if (postsQuery.isError) {
        content = (
            <div className="h-full w-full flex flex-col max-w-2xl">
                <CreatePostCard
                    className="my-4"
                    onPostCreated={onPostCreated}
                />
                <div className="flex flex-col flex-1 gap-4 w-full items-center justify-center">
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
            </div>
        );
    } else {
        if (posts.length === 0) {
            content = (
                <div className="h-full w-full flex flex-col max-w-2xl">
                    <CreatePostCard
                        className="my-4"
                        onPostCreated={onPostCreated}
                    />
                    <div className="flex flex-col flex-1 gap-4 w-full items-center justify-center px-6 text-center">
                        <Newspaper className="w-12 h-12 text-muted-foreground" />
                        <p className="text-base font-semibold text-foreground">
                            {t('empty_title')}
                        </p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            {t('empty_desc')}
                        </p>
                    </div>
                </div>
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
        <VisitTip>
            <div className="flex flex-col items-center w-full h-full px-4">
                {content}
            </div>
        </VisitTip>
    );
}

interface CreatePostCardProps {
    className?: string;
    onPostCreated: () => void;
}

function CreatePostCard({className, onPostCreated}: CreatePostCardProps) {
    const [text, setText] = newPost.useNewText();
    const [preview, setPreview] = useState(false);
    const [showPreviewOption, setShowPreviewOption] = useState(false);
    const [adjuster, setAdjuster] = useState<AdjusterPayload>({type: 'close'});
    const imagePreviewer = useImagePreviewerController();

    const t = useTranslations('community');
    const postRef = useRef<HTMLTextAreaElement>(null);
    const app = useAppContext();
    const backend = useBackend();
    const userQuery = useQuery({
        queryKey: ['userDetails'],
        queryFn: async () => forceUnwrap(await backend.getUserDetails2()),
    });

    const textTooLong = text.length > 4096;
    const showTextLength = text.length > 4000;

    const avatarUrl = useMemo(
        () =>
            userQuery.data?.user?.avatar
                ? createFileLink(userQuery.data.user.avatar)
                : '',
        [userQuery],
    );

    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const createMutation = useMutation({
        mutationFn: async (text: string) => {
            const result = await backend.communityPost({text});
            const details = {
                type: 'plain' as const,
                ...forceUnwrap(result),
                text,
                owner: (await users.ensureCachedSelf(app)).user,
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
            await app.queryClient.invalidateQueries({
                queryKey: ['communityPosts'],
            });
            return details;
        },
        onSuccess: () => {
            setText('');
            onPostCreated();
        },
        onError: error => {
            toast.error(error.message ?? t('post_create_error'));
        },
    });

    const attachImageMutation = useMutation({
        mutationFn: async (props: {file: File; crop: AdjusterCrop}) => {
            const {file, crop} = props;
            const post = postRef.current;
            const compressed = await resizeImage(file, crop);
            const descriptor = forceUnwrap(
                await backend.uploadFile(compressed),
            );
            let selection = null;
            if (post) {
                selection = [post.selectionStart, post.selectionEnd] as const;
            }
            setText(current => {
                let result = current;
                if (!current.endsWith('\n')) {
                    result += '\n';
                }
                const url = createFileLink(descriptor);
                result += `![](${url})\n`;
                return result;
            });
            if (post && selection !== null) {
                setTimeout(() => {
                    post.setSelectionRange(...selection);
                }, 1);
            }
        },
    });

    const forbidSend =
        createMutation.isPending ||
        attachImageMutation.isPending ||
        !text.trim() ||
        textTooLong;

    function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey && !isMobile()) {
            event.preventDefault();
            if (forbidSend) return;
            createMutation.mutate(event.currentTarget.value);
        }
    }

    function onPaste(event: React.ClipboardEvent) {
        const file = event.clipboardData.files[0];
        if (file && file.type.startsWith('image')) {
            event.preventDefault();
            onImageSelected(file);
        }
    }

    function attachImage() {
        imageInputRef.current?.click();
    }

    function onImageSelected(data: File) {
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
        setAdjuster({type: 'open', data});
    }

    function onImageAdjusted(file: File, crop: AdjusterCrop) {
        attachImageMutation.mutate({file, crop});
    }

    useEffect(() => {
        const post = postRef.current;
        if (!post) return;

        const observer = new ResizeObserver(([entry]) => {
            const style = window.getComputedStyle(post);
            const height = entry.contentRect.height;
            const lines = height / parseFloat(style.lineHeight);
            setShowPreviewOption(lines >= 6);
        });
        observer.observe(post);

        return () => {
            observer.disconnect();
        };
    }, [preview]);

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
                    {preview ? (
                        <MarkdownArea
                            className="text-foreground mt-2"
                            text={text}
                            onImageClick={e => {
                                e.stopPropagation();
                                void imagePreviewer.setPayload({
                                    type: 'open',
                                    src: e.currentTarget.src,
                                });
                            }}
                        />
                    ) : (
                        <textarea
                            ref={postRef}
                            className={cn(
                                'w-full mt-2',
                                'outline-none resize-none field-sizing-content',
                                'space-y-[1em] leading-5',
                            )}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={onKeyDown}
                            onPaste={onPaste}
                            placeholder={t('placeholder')}
                        />
                    )}
                    <div className="mt-1 w-full flex items-center">
                        {showTextLength ? (
                            <div
                                className={cn(
                                    'text-xs',
                                    textTooLong ? 'text-destructive' : '',
                                )}
                            >
                                {text.length} / 4096
                            </div>
                        ) : undefined}
                        <div className="flex-1" />
                        {text.length > 0 && (
                            <Button
                                onClick={() => {
                                    setText('');
                                    setPreview(false);
                                }}
                                variant="ghost"
                            >
                                <Trash />
                            </Button>
                        )}
                        {showPreviewOption && (
                            <Button
                                onClick={() => setPreview(!preview)}
                                variant="ghost"
                            >
                                {preview ? <Pen /> : <Eye />}
                            </Button>
                        )}
                        <Button
                            onClick={attachImage}
                            onMouseDown={event => event.preventDefault()}
                            variant="ghost"
                            className="me-2"
                        >
                            {attachImageMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Paperclip />
                            )}
                            <input
                                className="hidden"
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                placeholder="Avatar"
                                onChange={e => {
                                    const files = e.target.files;
                                    if (files) {
                                        void onImageSelected(files[0]);
                                    }
                                }}
                            />
                        </Button>
                        <div className="flex flex-col">
                            <Button
                                onClick={() =>
                                    forbidSend || createMutation.mutate(text)
                                }
                                disabled={forbidSend}
                            >
                                {createMutation.isPending ? (
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
            </div>
            <Adjuster
                title={t('adjuster')}
                payload={adjuster}
                setPayload={setAdjuster}
                onAdjusted={(file, result) => {
                    void onImageAdjusted(file, result);
                }}
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
            sessionStorage.getItem('community.scroll') ?? 'null',
        ) as ScrollState;
    }, [navigationType]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: items.length,
        getItemKey: index => items[index].key,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 1000,
        overscan: useOverscanAnimation(10),
        initialOffset: saved?.initialOffset,
        initialMeasurementsCache: saved?.initialMeasurementsCache,
        onChange: virtualizer => {
            if (virtualizer.isScrolling) return;
            sessionStorage.setItem(
                'community.scroll',
                JSON.stringify({
                    initialOffset: virtualizer.scrollOffset,
                    initialMeasurementsCache: virtualizer.measurementsCache,
                }),
            );
        },
    });

    virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (
        item,
        _delta,
        instance,
    ) => item.start < (instance.scrollOffset ?? 0);

    return virtualizer;
}

function useOverscanAnimation(target: number): number {
    const [overscan, setOverscan] = useState(0);
    useEffect(() => {
        if (overscan >= target) return;
        const callback = window.setTimeout(() => {
            setOverscan(value => value + 1);
        }, 100);
        return () => window.clearTimeout(callback);
    }, [overscan]);
    return overscan;
}

interface ListProps {
    virtualizer: Virtualizer<HTMLDivElement, Element>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    items: Item[];
}

function List({virtualizer, parentRef, items}: ListProps) {
    'use no memo';
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
                        className="max-w-2xl"
                        data-index={item.index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: `translate(-50%, ${item.start}px)`,
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
