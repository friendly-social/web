import {useBackend} from '@/backend.context';
import {Button} from '@/components/ui/button';
import {
    InfiniteData,
    QueryKey,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {Loader2, MessageCircle, AlertCircle, Clock} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {useState, useCallback, useMemo} from 'react';
import {
    CommunityPost,
    ListCommunityPostsResponse,
} from '@/network/friendly-client';
import {toast} from 'sonner';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';
import {MarkdownArea} from '@/components/ui/markdown-area';
import {Textarea} from '@/components/ui/textarea';
import {unwrap} from '@/network/result';
import {NetworkError} from '@/network/errors';
import {UserDetails} from '@/types/user-details';
import {formatNetworkError} from '@/services/backend-service';

export function CommunityPage() {
    const t = useTranslations('community');
    const backend = useBackend();
    const queryClient = useQueryClient();
    const [newPostText, setNewPostText] = useState('');

    const postsQuery = useInfiniteQuery<
        ListCommunityPostsResponse,
        NetworkError,
        InfiniteData<ListCommunityPostsResponse, string | null>,
        QueryKey,
        string | null
    >({
        queryKey: ['communityPosts'],
        queryFn: ({pageParam}) => backend.listPosts(pageParam).then(unwrap),
        initialPageParam: null,
        getNextPageParam: lastPage => lastPage.nextId ?? undefined,
    });

    const loadMore = () => {
        if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
            void postsQuery.fetchNextPage();
        }
    };

    const createPostMutation = useMutation({
        mutationFn: (text: string) => backend.createPost(text),
        onSuccess: () => {
            setNewPostText('');
            void queryClient.invalidateQueries({queryKey: ['communityPosts']});
            toast.success(t('post_created'));
        },
        onError: error => {
            toast.error(error.message ?? t('post_create_error'));
        },
    });

    const formatTimeAgo = (date: Date) => {
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
    };

    const handleCreatePost = useCallback(async () => {
        if (!newPostText.trim()) return;
        await createPostMutation.mutateAsync(newPostText);
    }, [newPostText, createPostMutation]);

    const isLoadingError = postsQuery.isError && postsQuery.data === undefined;

    let content;

    if (postsQuery.isLoading) {
        content = (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    } else if (isLoadingError) {
        content = (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <AlertCircle className="h-10 w-10 animate-pulse text-foreground/80" />
                <h3 className="text-center">
                    {postsQuery.error
                        ? formatNetworkError(postsQuery.error)
                        : t('unknown_error')}
                </h3>
                <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => void postsQuery.refetch()}
                >
                    {t('retry')}
                </Button>
            </div>
        );
    } else {
        const pages = postsQuery.data?.pages ?? [];
        const posts = pages.flatMap(p => p.data);

        if (posts.length === 0) {
            content = (
                <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center px-6 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground" />
                    <h3 className="text-base font-semibold text-foreground">
                        {t('empty_title')}
                    </h3>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        {t('empty_desc')}
                    </p>
                </div>
            );
        } else {
            content = (
                <div className="w-full flex flex-col gap-4">
                    {posts.map(post => (
                        <CommunityPostCard
                            key={post.id}
                            post={post}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))}
                </div>
            );
        }
    }

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4 py-4 gap-4">
            <CreatePostCard
                text={newPostText}
                onTextChange={setNewPostText}
                onSubmit={handleCreatePost}
                isSubmitting={createPostMutation.isPending}
            />
            {content}
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
                        'Load more'
                    )}
                </Button>
            </div>
        </div>
    );
}

interface CreatePostCardProps {
    text: string;
    onTextChange: (text: string) => void;
    onSubmit: () => Promise<void>;
    isSubmitting: boolean;
}

function CreatePostCard({
    text,
    onTextChange,
    onSubmit,
    isSubmitting,
}: CreatePostCardProps) {
    const t = useTranslations('community');
    const backend = useBackend();
    const userQuery = useQuery<UserDetails, NetworkError>({
        queryKey: ['userDetails'],
        queryFn: () => backend.getUserDetails().then(unwrap),
    });

    const avatarUrl = useMemo(
        () =>
            userQuery.data?.avatar ? createFileLink(userQuery.data.avatar) : '',
        [userQuery.data],
    );

    return (
        <div className="w-full bg-card rounded-xl border border-border p-4">
            <div className="w-full flex gap-3">
                <StyledAvatar
                    avatarClassName="w-10 h-10"
                    src={avatarUrl}
                    nickname={userQuery.data?.nickname ?? ''}
                />
                <div className="w-full flex-1 flex flex-col gap-2 min-w-0">
                    <Textarea
                        value={text}
                        onChange={e => onTextChange(e.target.value)}
                        placeholder={t('placeholder')}
                        className="min-h-15 max-h-48"
                    />
                    <div className="w-full flex items-center justify-end pt-2">
                        <Button
                            onClick={() => void onSubmit()}
                            disabled={!text.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                t('create_post')
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CommunityPostCardProps {
    post: CommunityPost;
    formatTimeAgo: (date: Date) => string;
}

function CommunityPostCard({post, formatTimeAgo}: CommunityPostCardProps) {
    // const t = useTranslations('community');

    const avatarUrl = post.owner.avatar
        ? createFileLink(post.owner.avatar)
        : undefined;
    const postTime = new Date(post.instant);

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex gap-3">
                <StyledAvatar
                    avatarClassName="w-10 h-10"
                    src={avatarUrl}
                    nickname={post.owner.nickname}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                            {post.owner.nickname}
                        </p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(postTime)}
                        </span>
                    </div>
                    <p className="mt-1 text-foreground whitespace-pre-wrap break-words">
                        <MarkdownArea text={post.text} />
                    </p>

                    {/*<div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => void onLike(post.id)}
                        >
                            <Heart className="h-4 w-4" />
                            {t('like')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                        >
                            <MessageCircle className="h-4 w-4" />
                            {t('comment')}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent ml-auto"
                        >
                            <Share2 className="h-4 w-4" />
                            {t('share')}
                        </Button>
                    </div>*/}
                </div>
            </div>
        </div>
    );
}
