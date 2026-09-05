import {Button} from '@/components/ui/button';
import {AvatarGroup} from '@/components/ui/avatar';
import {MessageCircle, Clock} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {
    CommunityPostDetailsPlain,
    CommunityPostDetailsDeleted,
} from '@/network/friendly-client';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';
import {MarkdownArea} from '@/components/ui/markdown-area';
import {useNavigate} from 'react-router';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import {communityPosts} from '@/services/community-posts-service';
import {CommunityPostId} from '@/network/friendly-client';
import {cn} from '@/lib/utils';

export interface CommunityPostCardProps {
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
                    post={post}
                    minimizeText={props.minimizeText}
                    minimizeToolbar={props.minimizeToolbar}
                    popDepth={props.popDepth}
                />
            );
        case 'deleted':
            return (
                <CommunityPostCardDeleted
                    post={post}
                    popDepth={props.popDepth}
                />
            );
    }
}

export interface CommunityPostCardPlainProps {
    post: CommunityPostDetailsPlain;
    minimizeText?: boolean;
    minimizeToolbar?: boolean;
    popDepth: number;
}

function CommunityPostCardPlain({
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

    async function navigateReplies() {
        await navigate(`/community/${post.id}/replies`, {
            state: {
                popDepth,
            },
        });
    }

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
            className="bg-card rounded-xl border border-border p-4 cursor-pointer"
            onClick={() => void navigateReplies()}
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
                    </div>
                    <MarkdownArea
                        className={cn(
                            'text-foreground transition-all duration-300 ease-in-out',
                            minimizeText && 'line-clamp-10',
                        )}
                        text={post.text}
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
    post: CommunityPostDetailsDeleted;
    popDepth: number;
}

function CommunityPostCardDeleted({
    post,
    popDepth,
}: CommunityPostCardDeletedProps) {
    const t = useTranslations('post');
    const navigate = useNavigate();
    const postTime = new Date(post.instant);

    async function navigateReplies() {
        await navigate(`/community/${post.id}/replies`, {
            state: {
                popDepth,
            },
        });
    }

    return (
        <div
            className="bg-card rounded-xl border border-border p-4 cursor-pointer flex items-center justify-between"
            onClick={() => void navigateReplies()}
        >
            <p className="italic text-foreground truncate cursor-pointer">
                {t('deleted')}
            </p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
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
