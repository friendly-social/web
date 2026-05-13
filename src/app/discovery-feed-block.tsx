'use client';

import {useTranslations} from 'next-intl';
import {useBackend} from '@/backend.context';
import {useQuery} from '@tanstack/react-query';
import {FeedItem} from '@/network/friendly-client';
import {formatNetworkError} from '@/services/backend-service';
import {toast} from 'sonner';
import {Heart} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {FeedReviewDeck} from '@/app/feed-review-desk';

type SwipeDirection = 'left' | 'right';

export function DiscoveryFeedBlock() {
    const t = useTranslations('profile.feed');
    const backend = useBackend();

    const feedQuery = useQuery({
        queryKey: ['feedQueue'],
        queryFn: () => backend.getFeedQueue(),
    });

    const [cards, setCards] = useState<FeedItem[]>([]);

    useEffect(() => {
        if (!feedQuery.data?.ok) {
            return;
        }

        setCards(feedQuery.data.data.entries);
    }, [feedQuery.data]);

    const feedErrorMessage =
        feedQuery.data && !feedQuery.data.ok
            ? formatNetworkError(feedQuery.data.error)
            : null;

    const onReview = useCallback(
        async (card: FeedItem, direction: SwipeDirection) => {
            const request = {
                userId: card.details.id,
                userAccessHash: card.details.accessHash,
            };

            const result =
                direction === 'right'
                    ? await backend.sendFriendRequest(request)
                    : await backend.declineFriendRequest(request);

            if (!result.ok) {
                toast.error(formatNetworkError(result.error));
            }

            setCards(current =>
                current.filter(item => item.details.id !== card.details.id),
            );
        },
        [backend, t],
    );

    return (
        <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-secondary p-2 text-secondary-foreground">
                        <Heart className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                            {t('title')}
                        </h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {t('desc')}
                        </p>
                    </div>
                </div>
            </div>

            <FeedReviewDeck
                cards={cards}
                isLoading={feedQuery.isLoading}
                isRefetching={feedQuery.isRefetching}
                isError={feedQuery.isError || Boolean(feedErrorMessage)}
                errorMessage={feedErrorMessage}
                onRetry={() => {
                    void feedQuery.refetch();
                }}
                onReview={onReview}
            />
        </section>
    );
}
