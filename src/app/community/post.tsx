import {useImagePreviewerController} from '@/components/image-previewer';
import {Button} from '@/components/ui/button';
import {openBlankShortcut} from '@/lib/open-blank-shortcut';
import {AvatarGroup} from '@/components/ui/avatar';
import {MessageCircle, Clock} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {
    CommunityPostDetailsPlain,
    CommunityPostDetailsDeleted,
} from '@/network/friendly-client';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';
import {useNavigate} from 'react-router';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import {communityPosts} from '@/services/community-posts-service';
import {CommunityPostId} from '@/network/friendly-client';
import {cn} from '@/lib/utils';
import {useEffect, useRef, useState, lazy} from 'react';

const MarkdownArea = lazy(() =>
    import('@/components/ui/markdown-area').then(m => ({
        default: m.MarkdownArea,
    })),
);

export interface CommunityPostCardProps {
    className?: string;
    postId: CommunityPostId;
    minimizeText?: boolean;
    minimizeToolbar?: boolean;
    popDepth: number;
}

export function CommunityPostCard(props: CommunityPostCardProps) {
    const postResource = communityPosts.usePost(props.postId);
    if (!postResource.data) {
        throw new Error(`${JSON.stringify(postResource)}`);
    }
    const post = postResource.data;
    switch (post.type) {
        case 'plain':
            return (
                <CommunityPostCardPlain
                    className={props.className}
                    post={post}
                    minimizeText={props.minimizeText}
                    minimizeToolbar={props.minimizeToolbar}
                    popDepth={props.popDepth}
                />
            );
        case 'deleted':
            return (
                <CommunityPostCardDeleted
                    className={props.className}
                    post={post}
                    popDepth={props.popDepth}
                />
            );
    }
}

export interface CommunityPostCardPlainProps {
    className?: string;
    post: CommunityPostDetailsPlain;
    minimizeText?: boolean;
    minimizeToolbar?: boolean;
    popDepth: number;
}

function CommunityPostCardPlain({
    className,
    post,
    minimizeText,
    minimizeToolbar,
    popDepth,
}: CommunityPostCardPlainProps) {
    const t = useTranslations('post');
    const navigate = useNavigate();
    const storage = useFriendlyStorage();

    const avatarUrl = post.owner.avatar
        ? createFileLink(post.owner.avatar)
        : undefined;
    const postTime = new Date(post.instant);

    const textRef = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const check = () => {
            setIsTruncated(el.scrollHeight - el.clientHeight > lineHeight / 2);
        };
        check();
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [post.text]);

    const imagePreviewer = useImagePreviewerController();

    async function navigateProfile(event: React.MouseEvent) {
        event.stopPropagation();
        await storage.userAccessHashes.save([
            {
                id: post.owner.id,
                accessHash: post.owner.accessHash,
            },
        ]);
        await navigate(`/user/${post.owner.id}`);
    }

    interface NavigateRepliesProps {
        showKeyboard: boolean;
    }

    function navigateReplies(
        event: React.MouseEvent,
        {showKeyboard}: NavigateRepliesProps,
    ) {
        event.stopPropagation();
        openBlankShortcut(event, {
            url: `/community/${post.id}/replies`,
            onNavigate: url =>
                void navigate(url, {
                    state: {popDepth, showKeyboard},
                }),
        });
    }

    return (
        <div
            className={cn('p-4', className)}
            onClick={e => {
                if (window.getSelection()?.isCollapsed === false) return;
                navigateReplies(e, {showKeyboard: false});
            }}
            onAuxClick={e => navigateReplies(e, {showKeyboard: false})}
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
                            onClick={event => {
                                if (
                                    window.getSelection()?.isCollapsed === false
                                )
                                    return;
                                void navigateProfile(event);
                            }}
                        >
                            {post.owner.nickname}
                        </p>
                        <span
                            title={postTime.toLocaleString()}
                            className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap"
                        >
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(t, postTime)}
                            {post.edited ? ' ' + t('edited') : undefined}
                        </span>
                    </div>
                    <MarkdownArea
                        className={cn(
                            'text-foreground transition-all duration-300 ease-in-out',
                            minimizeText && [
                                'line-clamp-10 max-h-[50vh]',
                                isTruncated && 'fade-mask',
                            ],
                        )}
                        ref={textRef}
                        text={post.text}
                        onImageClick={e => {
                            e.stopPropagation();
                            void imagePreviewer.setPayload({
                                type: 'open',
                                src: e.currentTarget.src,
                            });
                        }}
                    />
                </div>
            </div>
            {!minimizeToolbar && (
                <div className="flex items-center justify-end mt-2">
                    {post.replyPreviews.length > 0 && (
                        <AvatarGroup>
                            {post.replyPreviews.toReversed().map(user => (
                                <StyledAvatar
                                    avatarClassName={cn('w-6 h-6')}
                                    fallbackClassName="text-[0.7em]"
                                    key={user.id}
                                    src={
                                        user.avatar
                                            ? createFileLink(user.avatar)
                                            : undefined
                                    }
                                    nickname={user.nickname}
                                />
                            ))}
                        </AvatarGroup>
                    )}
                    <Button
                        onClick={e => navigateReplies(e, {showKeyboard: true})}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                        <MessageCircle className="h-4 w-4" />
                        {<p>{t('reply')}</p>}
                    </Button>
                </div>
            )}
        </div>
    );
}

interface CommunityPostCardDeletedProps {
    className?: string;
    post: CommunityPostDetailsDeleted;
    popDepth: number;
}

function CommunityPostCardDeleted({
    className,
    post,
    popDepth,
}: CommunityPostCardDeletedProps) {
    const t = useTranslations('post');
    const navigate = useNavigate();
    const postTime = new Date(post.instant);

    function navigateReplies(event: React.MouseEvent) {
        event.stopPropagation();
        openBlankShortcut(event, {
            url: `/community/${post.id}/replies`,
            onNavigate: url =>
                void navigate(url, {
                    state: {popDepth},
                }),
        });
    }

    return (
        <div
            className={cn(
                'p-4 cursor-pointer flex items-center justify-between',
                className,
            )}
            onClick={e => {
                if (window.getSelection()?.isCollapsed === false) return;
                navigateReplies(e);
            }}
            onAuxClick={e => navigateReplies(e)}
        >
            <p className="italic text-foreground truncate cursor-pointer">
                {t('deleted')}
            </p>
            <span
                title={postTime.toLocaleString()}
                className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap"
            >
                <Clock className="h-3 w-3" />
                {formatTimeAgo(t, postTime)}
            </span>
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
