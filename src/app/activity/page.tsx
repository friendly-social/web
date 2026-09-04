import {useMutation} from '@tanstack/react-query';
import {useNavigationType, NavigationType} from 'react-router';
import {useVirtualizer, VirtualItem} from '@tanstack/react-virtual';
import {activity} from '@/services/activity';
import {cn} from '@/lib/utils';
import {useAppContext} from '@/app.context';
import {communityPosts} from '@/services/community-posts-service';
import {useNavigate} from 'react-router';
import {useEffect, ReactElement, useRef, useMemo} from 'react';
import {MarkdownSpan} from '@/components/ui/markdown-span';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';
import {forceUnwrap} from '@/network/result';
import {Button} from '@/components/ui/button';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Loader2, AlertCircle, Inbox, Clock} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {
    ActivityDetails,
    ActivityDetailsReply,
    ActivityId,
} from '@/network/friendly-client';
import {useErrorMessage} from '@/network/error-message';

export function ActivityPage() {
    const t = useTranslations('activity');
    const errorMessage = useErrorMessage();
    const app = useAppContext();

    const activityQuery = useInfiniteQuery(activity.listOptions(app));

    let content;

    if (activityQuery.isPending) {
        content = (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    } else if (activityQuery.isError) {
        content = (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <AlertCircle className="h-10 w-10 animate-pulse text-foreground/80" />
                <p className="text-center">
                    {errorMessage(activityQuery.error)}
                </p>
                <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => void activityQuery.refetch()}
                >
                    {t('retry')}
                </Button>
            </div>
        );
    } else {
        const pages = activityQuery.data?.pages ?? [];
        const activity = pages.flatMap(p => p.data);

        if (activity.length === 0) {
            content = (
                <div className="flex flex-col h-full gap-2 w-full items-center justify-center px-6 text-center">
                    <Inbox className="w-12 h-12 text-muted-foreground" />
                    <p className="text-base font-semibold text-foreground">
                        {t('empty-title')}
                    </p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        {t('empty-desc')}
                    </p>
                </div>
            );
        } else {
            content = (
                <ActivityList
                    onFetch={() => void activityQuery.fetchNextPage()}
                    hasNext={activityQuery.hasNextPage}
                    activity={activity}
                />
            );
        }
    }

    return (
        <div className="h-full items-center w-full max-w-2xl mx-auto gap-4">
            {content}
        </div>
    );
}

type TimeGroup = 'today' | 'yesterday' | 'older';

interface ActivityListProps {
    activity: ActivityDetails[];
    hasNext: boolean;
    onFetch: () => void;
}

function ActivityList({activity, onFetch, hasNext}: ActivityListProps) {
    const app = useAppContext();

    useEffect(() => {
        let shouldBreak = false;
        void (async () => {
            for (const item of activity) {
                if (shouldBreak) break;
                switch (item.type) {
                    case 'reply':
                        await communityPosts.prefetchDetails(
                            app,
                            item.post.id,
                            {staleTime: Infinity},
                        );
                        break;
                    default:
                        item satisfies never;
                }
            }
        })();
        return () => {
            shouldBreak = true;
        };
    }, []);

    const timeGroups = Object.groupBy(activity, activity => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date();
        startOfYesterday.setDate(startOfToday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);

        let group: TimeGroup;
        const postDate = new Date(activity.instant);
        if (postDate > startOfToday) {
            group = 'today';
        } else if (postDate > startOfYesterday) {
            group = 'yesterday';
        } else {
            group = 'older';
        }

        return group;
    });

    const items = Object.entries(timeGroups).flatMap(
        ([timeGroup, activity]) => {
            return [
                {
                    key: timeGroup,
                    Component: (
                        <TimeGroupHeading timeGroup={timeGroup as TimeGroup} />
                    ),
                },
                ...activity.map(details => {
                    return {
                        key: details.id.toString(),
                        Component: <ActivityCard id={details.id} />,
                    };
                }),
            ];
        },
    );

    if (hasNext) {
        items.push({
            key: 'loader',
            Component: <Loader onAppear={onFetch} />,
        });
    }

    return <List items={items} />;
}

interface TimeGroupHeadingProps {
    timeGroup: TimeGroup;
}

function TimeGroupHeading({timeGroup}: TimeGroupHeadingProps) {
    const t = useTranslations('activity');

    let title;
    switch (timeGroup) {
        case 'today':
            title = t('today');
            break;
        case 'yesterday':
            title = t('yesterday');
            break;
        case 'older':
            title = t('older');
            break;
        default:
            timeGroup satisfies never;
    }

    return <p className="text-lg font-semibold">{title}</p>;
}

interface ActivityCardProps {
    id: ActivityId;
}

function ActivityCard({id}: ActivityCardProps) {
    const app = useAppContext();

    const details = activity.useDetails(id).data;
    if (details === undefined) {
        throw new Error('Activity details must be present after loading');
    }

    const readMutation = useMutation({
        mutationKey: ['activityRead', id],
        mutationFn: async () => {
            await activity.setDetails(app, {
                ...details,
                isRead: true,
            });
            forceUnwrap(await app.backend.activityRead({id}));
        },
    });

    function handleClick() {
        if (readMutation.isPending) return;
        readMutation.mutate();
    }

    let content;

    switch (details.type) {
        case 'reply':
            content = (
                <ReplyActivityCard details={details} onClick={handleClick} />
            );
            break;
    }

    return (
        <div
            className={cn(
                'rounded-xl cursor-pointer border border-border',
                details.isRead ? 'bg-card' : 'bg-primary/10',
            )}
        >
            {content}
        </div>
    );
}

export interface ReplyActivityCardProps {
    details: ActivityDetailsReply;
    onClick: () => void;
}

function ReplyActivityCard({details, onClick}: ReplyActivityCardProps) {
    const t = useTranslations('activity');

    const navigate = useNavigate();
    const avatar = details.post.owner.avatar
        ? createFileLink(details.post.owner.avatar)
        : undefined;
    const text = t.rich('reply', {
        nickname: details.post.owner.nickname,
        b: text => <strong>{text}</strong>,
    });
    async function navigatePost() {
        await navigate(`/community/${details.post.id}/replies`);
        onClick();
    }
    return (
        <div
            className="flex gap-2 items-center m-4"
            onClick={() => void navigatePost()}
        >
            <StyledAvatar
                avatarClassName="w-10 h-10"
                nickname={details.post.owner.nickname}
                src={avatar}
            />
            <span className="line-clamp-2 text-foreground break-words">
                {text} "
                <MarkdownSpan text={details.post.text} />"
            </span>
            <div className="flex-1" />
            <span className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(t, details.instant)}
            </span>
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

function formatTimeAgo(
    t: ReturnType<typeof useTranslations<'activity'>>,
    iso8601: string,
) {
    const date = new Date(iso8601);
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

interface Item {
    key: string;
    Component: ReactElement;
}

interface ListProps {
    items: Item[];
}

interface ScrollState {
    initialOffset: number;
    initialMeasurementsCache: VirtualItem[];
}

function List({items}: ListProps) {
    const parentRef = useRef(null);

    const navigationType = useNavigationType();
    const saved = useMemo(() => {
        if (navigationType !== NavigationType.Pop) {
            return null;
        }
        return JSON.parse(
            sessionStorage.getItem('activity.scroll') ?? 'null',
        ) as ScrollState;
    }, [navigationType]);

    const virtualizer = useVirtualizer({
        count: items.length,
        getItemKey: index => items[index].key,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 1000,
        overscan: 30,
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

    return (
        <div
            ref={parentRef}
            className="w-full h-full overflow-y-auto scrollbar-none px-4"
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
                        <div className="h-2" />
                    </div>
                ))}
            </div>
        </div>
    );
}
