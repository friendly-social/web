import {useAppContext} from '@/app.context';
import {Button} from '@/components/ui/button';
import {useEmailBindingSuggestion} from '@/lib/email-binding-suggestion';
import {FeedItem, FeedQueueResponse} from '@/network/friendly-client';
import {Activity, BookUser, Loader2} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {useTranslations} from 'use-intl';
import {EditProfileDialog} from '@/app/edit/dialog';
import {SuggestEmailBindingDialog} from '@/app/suggest-email-binding-dialog';
import {FeedDialog} from '@/app/feed/feed-dialog';
import {useBackend} from '@/backend.context';
import {useQuery} from '@tanstack/react-query';
import {formatNetworkError} from '@/services/backend-service';
import {toast} from 'sonner';
import {cn} from '@/lib/utils';
import {unwrap} from '@/network/result';
import {NetworkError} from '@/network/errors';

export type SwipeDirection = 'left' | 'right';

function getFeedItemKey(item: FeedItem) {
    return `${item.details.id}-${item.isRequest ? 'request' : 'suggested'}`;
}

function FeedEmptyState() {
    const t = useTranslations('profile.feed');

    return (
        <div className="h-full flex flex-col items-center justify-center gap-2 px-6 text-center">
            <BookUser className="w-12 h-12" />
            <h3 className="text-base font-semibold text-foreground">
                {t('empty_title')}
            </h3>
            <p className="max-w-xs text-sm text-muted-foreground">
                {t('empty_desc')}
            </p>
        </div>
    );
}

export default function FeedPage() {
    const t = useTranslations('profile.feed');

    const backend = useBackend();

    const feedQuery = useQuery<FeedQueueResponse, NetworkError>({
        queryKey: ['feedQueue'],
        queryFn: () => backend.getFeedQueue().then(unwrap),
    });

    const [cards, setCards] = useState<FeedItem[]>([]);

    const [selectedCard, setSelectedCard] = useState<FeedItem | null>(null);
    const [pendingCardId, setPendingCardId] = useState<string | null>(null);
    const isBusy = pendingCardId !== null;

    const app = useAppContext();
    const {
        status: emailSuggestionStatus,
        setStatus: setEmailSuggestionStatus,
        trackSwipe,
    } = useEmailBindingSuggestion(app.userDetails?.email ?? null);

    useEffect(() => {
        if (!feedQuery.data) {
            return;
        }

        setCards(feedQuery.data.entries);
        if (feedQuery.data.entries.length > 0)
            setSelectedCard(feedQuery.data.entries[0]);
    }, [feedQuery.data]);

    const feedErrorMessage = feedQuery.error
        ? formatNetworkError(feedQuery.error)
        : null;

    const isLoadingError = feedQuery.isError && feedQuery.data === undefined;

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
        [backend],
    );

    const handleReview = async (direction: SwipeDirection) => {
        if (!selectedCard || isBusy) return;

        setPendingCardId(getFeedItemKey(selectedCard));

        trackSwipe();

        try {
            await onReview(selectedCard, direction);

            // Wait for fade out animation
            await new Promise(resolve => setTimeout(resolve, 150));

            const currentIndex = cards.findIndex(
                card => getFeedItemKey(card) === getFeedItemKey(selectedCard),
            );
            const nextIndex = currentIndex + 1;
            const haveMoreCards = nextIndex < cards.length;

            if (haveMoreCards) {
                setSelectedCard(cards[nextIndex]);
            } else {
                setSelectedCard(null);
            }
        } finally {
            setPendingCardId(null);
        }
    };

    const onRetry = () => {
        void feedQuery.refetch();
    };

    if (feedQuery.isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isLoadingError) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-destructive/30 bg-card px-6 text-center">
                <Activity className="h-8 w-8 text-destructive" />
                <p className="mt-4 text-sm text-foreground">
                    {feedErrorMessage ?? t('queue_error')}
                </p>
                <Button className="mt-5 cursor-pointer" onClick={onRetry}>
                    {t('retry')}
                </Button>
            </div>
        );
    }

    if (cards.length === 0 || selectedCard === null) {
        return <FeedEmptyState />;
    }

    return (
        <div className="w-full min-h-full sm:p-4 flex flex-col justify-center items-center">
            <div
                className={cn(
                    'min-h-full w-full shrink-0 sm:w-90 md:w-110',
                    'sm:rounded-2xl bg-card',
                    'transition-[width] duration-300 ease-in-out',
                )}
            >
                {selectedCard && (
                    <FeedDialog
                        selectedCard={selectedCard}
                        isBusy={isBusy}
                        handleReview={direction => void handleReview(direction)}
                    />
                )}
            </div>
            <SuggestEmailBindingDialog
                status={emailSuggestionStatus}
                setStatus={setEmailSuggestionStatus}
            />
            <EditProfileDialog
                open={emailSuggestionStatus === 'accepted'}
                setOpen={isOpen => {
                    if (!isOpen) setEmailSuggestionStatus('declined');
                }}
            />
        </div>
    );
}
