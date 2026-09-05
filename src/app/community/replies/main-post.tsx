import {Button} from '@/components/ui/button';
import {toast} from 'sonner';
import {CommunityPostDescriptor} from '@/network/friendly-client';
import {communityPosts} from '@/services/community-posts-service';
import {forceUnwrap} from '@/network/result';
import {CommunityDetailsResponse} from '@/network/friendly-client';
import {useMutation} from '@tanstack/react-query';
import {MainPostMenu} from '@/app/community/replies/main-post-menu';
import {Send, Loader2, Pen, X} from 'lucide-react';
import {cn} from '@/lib/utils';
import {users} from '@/services/users-service';
import {useAppContext} from '@/app.context';
import {Clock} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {CommunityPostDetailsPlain} from '@/network/friendly-client';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';
import {MarkdownArea} from '@/components/ui/markdown-area';
import {useNavigate} from 'react-router';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import {RefObject, useEffect, useRef, useState, useMemo} from 'react';

interface MainPostCardProps {
    details: CommunityDetailsResponse;
    postRef: RefObject<HTMLDivElement | null>;
    popDepth: number;
}

const emojis = [
    '❤️',
    '🔥',
    '👍',
    '🤝',
    '🎉',
    '🤯',
    '👀',
    '🥰',
    '🥺',
    '😭',
    '😇',
    '💯',
    '✅',
    '🫡',
];

type InputAction = 'send' | 'edit';

export function MainPostCard({details, postRef, popDepth}: MainPostCardProps) {
    const app = useAppContext();

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const createTextBackup = useRef('');
    const [text, setText] = useState('');
    const [action, setAction] = useState<InputAction>('send');

    const textTooLong = text.length > 4096;
    const showTextLength = text.length > 4000;

    const self = users.useSelf(app);

    const deleteMutation = useDeleteMutation({details, popDepth});

    const createMutation = useCreateMutation({
        details,
        popDepth,
        onSuccess: () => setText(''),
    });

    const editMutation = useEditMutation({
        details,
        onSuccess: stopEditing,
    });

    const isSubmitting = createMutation.isPending || editMutation.isPending;
    const forbidSubmit = isSubmitting || !text.trim() || textTooLong;

    function startEditing() {
        if (isSubmitting) return;
        inputRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
        });
        createTextBackup.current = text;
        setAction('edit');
        if (details.post.type !== 'plain') {
            throw new Error('Can only edit plain posts');
        }
        setText(details.post.text);
    }

    function stopEditing() {
        setAction('send');
        setText(createTextBackup.current);
    }

    function handleSubmit(text: string) {
        if (forbidSubmit) return;
        switch (action) {
            case 'send':
                createMutation.mutate({
                    text,
                    redirect: true,
                });
                break;
            case 'edit':
                editMutation.mutate(text);
                break;
            default:
                action satisfies never;
        }
    }

    function onDelete() {
        if (isSubmitting) return;
        deleteMutation.mutate();
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (isSubmitting) return;
        if (event.key === 'Enter' && !event.shiftKey && !isMobile()) {
            event.preventDefault();
            handleSubmit(event.currentTarget.value.trim());
        }
    }

    useEffect(() => {
        const reply = inputRef.current;
        if (reply) {
            reply.style.height = 'auto';
            reply.style.height = `${reply.scrollHeight}px`;
        }
    }, [text]);

    const t = useTranslations('replies');

    const selfAvatar = useMemo(
        () =>
            self.data?.user?.avatar
                ? createFileLink(self.data.user.avatar)
                : '',
        [self],
    );

    let card;
    if (deleteMutation.isPending) {
        card = <MainPostCardLoading />;
    } else
        switch (details.post.type) {
            case 'plain':
                card = (
                    <MainPostCardPlain
                        post={details.post}
                        action={action}
                        onDelete={onDelete}
                        onEdit={startEditing}
                        isAuthor={self.data?.user?.id === details.post.owner.id}
                    />
                );
                break;
            case 'deleted':
                card = <MainPostCardDeleted />;
                break;
        }

    return (
        <div className="scroll-m-40" ref={postRef}>
            {card}
            <div className="h-2" />
            <div className="flex bg-card rounded-xl border border-border flex-row gap-2 px-2 py-1">
                <StyledAvatar
                    avatarClassName="mt-1 w-8 h-8"
                    src={selfAvatar}
                    nickname={self.data?.user?.nickname ?? ''}
                />
                <div className="w-full flex flex-col">
                    <textarea
                        ref={inputRef}
                        className={cn(
                            'w-full content-center',
                            'text-sm outline-none resize-none',
                            'scroll-m-60',
                        )}
                        id="reply"
                        value={text}
                        onKeyDown={onKeyDown}
                        onChange={e => setText(e.target.value)}
                        placeholder={t('reply-placeholder')}
                    />
                    <div className="w-full flex">
                        {textTooLong ? (
                            <div className="text-destructive text-xs mb-2">
                                {t('too-long')}
                            </div>
                        ) : undefined}
                        <div className="flex-1" />
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
                    </div>
                </div>
                <Button
                    className="mt-1 w-8 h-8"
                    onClick={stopEditing}
                    variant="ghost"
                >
                    {action === 'edit' ? <X /> : undefined}
                </Button>
                <Button
                    className="mt-1 w-8 h-8"
                    onClick={() => handleSubmit(text)}
                    disabled={forbidSubmit}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : action === 'send' ? (
                        <Send />
                    ) : (
                        <Pen />
                    )}
                </Button>
            </div>
            <div className="h-2" />
            <div
                className={cn(
                    'flex gap-1 overflow-x-auto scrollbar-none',
                    action === 'edit'
                        ? 'pointer-events-none opacity-50 select-none'
                        : '',
                )}
            >
                {emojis.map((emoji, index) => (
                    <Emoji
                        key={index}
                        emoji={emoji}
                        disabled={isSubmitting}
                        onClick={() => createMutation.mutate({text: emoji})}
                    />
                ))}
            </div>
            <div className="h-4" />
        </div>
    );
}

interface EmojiProps {
    emoji: string;
    onClick: () => void;
    disabled: boolean;
}

function Emoji({emoji, onClick, disabled}: EmojiProps) {
    return (
        <span
            onClick={() => {
                if (disabled) return;
                onClick();
            }}
            className={cn(
                'flex bg-card rounded-xl',
                'border border-border flex-row gap-2 px-2 py-1 hover:bg-accent/50',
                'cursor-pointer',
                disabled ? 'opacity-40' : '',
            )}
        >
            {emoji}
        </span>
    );
}

function MainPostCardLoading() {
    return (
        <div className="bg-card rounded-xl border border-border p-4 cursor-pointer">
            <Loader2 className="m-auto animate-spin text-muted-foreground" />
        </div>
    );
}

export interface MainPostCardPlainProps {
    post: CommunityPostDetailsPlain;
    action: InputAction;
    onDelete: () => void;
    onEdit: () => void;
    isAuthor: boolean;
}

function MainPostCardPlain({
    post,
    action,
    onDelete,
    onEdit,
    isAuthor,
}: MainPostCardPlainProps) {
    const t = useTranslations('post');
    const navigate = useNavigate();
    const storage = useFriendlyStorage();

    const avatarUrl = post.owner.avatar
        ? createFileLink(post.owner.avatar)
        : undefined;
    const postTime = new Date(post.instant);

    async function navigateProfile(event: React.MouseEvent) {
        event.stopPropagation();
        await storage.userAccessHashes.save({
            id: post.owner.id,
            accessHash: post.owner.accessHash,
        });
        await navigate(`/user/${post.owner.id}`);
    }

    return (
        <div
            className={cn(
                'bg-card rounded-xl border border-border p-4',
                action === 'edit'
                    ? 'pointer-events-none opacity-50 select-none'
                    : '',
            )}
        >
            <div className="flex gap-3">
                <StyledAvatar
                    avatarClassName="w-10 h-10 cursor-pointer"
                    onClick={event => void navigateProfile(event)}
                    src={avatarUrl}
                    nickname={post.owner.nickname}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p
                            className="font-semibold text-foreground truncate cursor-pointer"
                            onClick={event => void navigateProfile(event)}
                        >
                            {post.owner.nickname}
                        </p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(t, postTime)}
                            {post.edited ? ' ' + t('edited') : undefined}
                        </span>
                        <div className="flex-1" />
                        <MainPostMenu
                            onDelete={onDelete}
                            onEdit={onEdit}
                            showDelete={isAuthor}
                        />
                    </div>
                    <div className="text-foreground break-words">
                        <MarkdownArea text={post.text} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MainPostCardDeleted() {
    const t = useTranslations('post');
    return (
        <div className="bg-card rounded-xl border border-border p-4 cursor-pointer">
            <p className="italic text-foreground truncate cursor-pointer">
                {t('deleted')}
            </p>
        </div>
    );
}

function formatTimeAgo(
    t: ReturnType<typeof useTranslations<'post'>>,
    date: Date,
) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return t('just_now');
    if (diffMins < 60) return t('minutes_ago', {count: diffMins});
    if (diffHours < 24) return t('hours_ago', {count: diffHours});
    if (diffDays < 7) return t('days_ago', {count: diffDays});
    return date.toLocaleDateString();
}

function isMobile(): boolean {
    if (
        'userAgentData' in navigator &&
        typeof navigator.userAgentData === 'object' &&
        navigator.userAgentData !== null &&
        'mobile' in navigator.userAgentData
    ) {
        return !!navigator.userAgentData.mobile;
    }
    return false;
}

interface UseDeleteMutationProps {
    details: CommunityDetailsResponse;
    popDepth: number;
}

function useDeleteMutation({details, popDepth}: UseDeleteMutationProps) {
    const app = useAppContext();
    const navigate = useNavigate();
    const t = useTranslations('replies');

    async function navigateReplies(descriptor: CommunityPostDescriptor) {
        await navigate(`/community/${descriptor.id}/replies`, {
            state: {popDepth} as unknown,
            replace: true,
        });
    }

    return useMutation({
        mutationKey: ['communityDelete', details.post.id],
        mutationFn: async () => {
            const result = await app.backend.communityDelete({
                id: details.post.id,
            });
            forceUnwrap(result);
            if (details.replies.data.length === 0) {
                if (details.upstream.length === 0) {
                    await communityPosts.prefetchList(app, {staleTime: 0});
                    await navigate('/community');
                } else {
                    const lastUpstream =
                        details.upstream[details.upstream.length - 1];
                    await app.queryClient.prefetchInfiniteQuery({
                        ...communityPosts.repliesOptions(app, lastUpstream),
                        staleTime: 0,
                    });
                    await navigateReplies({...lastUpstream});
                }
            } else {
                await communityPosts.setPosts(app, [
                    {
                        type: 'deleted',
                        id: details.post.id,
                        accessHash: details.post.accessHash,
                        instant: details.post.instant,
                        replyPreviews: details.post.replyPreviews,
                    },
                ]);
            }
        },
        onError: error => {
            toast.error(error.message ?? t('post_create_error'));
        },
    });
}

interface UseCreateMutationProps {
    details: CommunityDetailsResponse;
    popDepth: number;
    onSuccess: () => void;
}

function useCreateMutation({
    details,
    popDepth,
    onSuccess,
}: UseCreateMutationProps) {
    const app = useAppContext();
    const navigate = useNavigate();
    const t = useTranslations('replies');

    async function navigateReplies(descriptor: CommunityPostDescriptor) {
        await navigate(`/community/${descriptor.id}/replies`, {
            state: {popDepth} as unknown,
            replace: true,
        });
    }

    return useMutation({
        mutationFn: async (props: {text: string; redirect?: boolean}) => {
            const post = {
                replyTo: {
                    id: details.post.id,
                    accessHash: details.post.accessHash,
                },
                text: props.text,
            };
            const result = await app.backend.communityPost(post);
            const response = {
                post: {
                    type: 'plain',
                    ...post,
                    ...forceUnwrap(result),
                    replyPreviews: [],
                    instant: new Date().toISOString(),
                    owner: (await users.ensureSelf(app)).user,
                    edited: false,
                },
                replies: {data: [], nextId: null},
                upstream: [...details.upstream, details.post],
            } satisfies CommunityDetailsResponse;
            await communityPosts.setDetails(app, [response]);
            if (props.redirect) {
                void app.queryClient.invalidateQueries({
                    queryKey: ['communityReplies', details.post.id],
                });
                await navigateReplies(response.post);
                onSuccess();
            } else {
                await app.queryClient.prefetchQuery({
                    queryKey: ['communityReplies', details.post.id],
                });
            }
        },
        onError: error => {
            toast.error(error.message ?? t('post_create_error'));
        },
    });
}

interface UseEditMutationProps {
    details: CommunityDetailsResponse;
    onSuccess: () => void;
}

function useEditMutation({details, onSuccess}: UseEditMutationProps) {
    const app = useAppContext();
    const t = useTranslations('replies');

    return useMutation({
        mutationFn: async (text: string) => {
            if (details.post.type !== 'plain') {
                throw new Error('Can only edit plain posts');
            }

            forceUnwrap(
                await app.backend.communityEdit(details.post.id, {
                    text: {value: text},
                }),
            );
            await communityPosts.setDetails(app, [
                {
                    ...details,
                    post: {
                        ...details.post,
                        text,
                        edited: true,
                    },
                },
            ]);
        },
        onSuccess,
        onError: () => toast.error(t('unknown_error')),
    });
}
