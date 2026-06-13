import {useAppContext} from '@/app.context';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {createFileLink, truncateString} from '@/lib/utils';
import {useEmailBindingSuggestion} from '@/lib/email-binding-suggestion';
import {FeedItem} from '@/network/friendly-client';
import {Activity, Loader2} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'use-intl';
import {EditProfileDialog} from '@/app/edit/dialog';
import {SuggestEmailBindingDialog} from '@/app/suggest-email-binding-dialog';
import {FeedDialog} from '@/app/feed-dialog';
import {StyledAvatar} from '@/components/styled-avatar';
import {useLocation} from "react-router";

interface FeedLocationState {
    feedDialogueState?: {
        selectedCard: FeedItem;
    };
}

export type EmailBindingSuggestionStatus =
    | 'pending'
    | 'suggested'
    | 'declined'
    | 'accepted';

export type SwipeDirection = 'left' | 'right';

function getFeedItemKey(item: FeedItem) {
    return `${item.details.id}-${item.isRequest ? 'request' : 'suggested'}`;
}

function FeedEmptyState() {
    const t = useTranslations('profile.feed');

    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {t('empty_title')}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
                {t('empty_desc')}
            </p>
        </div>
    );
}

export function FeedReviewDeck({
    cards,
    isLoading,
    isRefetching: _isRefetching,
    isError,
    errorMessage,
    onRetry,
    onReview,
}: {
    cards: FeedItem[];
    isLoading: boolean;
    isRefetching: boolean;
    isError: boolean;
    errorMessage: string | null;
    onRetry: () => void;
    onReview: (card: FeedItem, direction: SwipeDirection) => Promise<void>;
}) {
    const t = useTranslations('profile.feed');
    const [selectedCard, setSelectedCard] = useState<FeedItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pendingCardId, setPendingCardId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const isBusy = pendingCardId !== null;

    const app = useAppContext();
    const location = useLocation();
    const {
        status: emailSuggestionStatus,
        setStatus: setEmailSuggestionStatus,
        trackSwipe,
    } = useEmailBindingSuggestion(app.userDetails?.email ?? null);

    const handleCardClick = (card: FeedItem) => {
        setSelectedCard(card);
        setIsDialogOpen(true);
    };

    const handleReview = async (direction: SwipeDirection) => {
        if (!selectedCard || isBusy) return;

        setPendingCardId(getFeedItemKey(selectedCard));
        setIsAnimating(true);

        trackSwipe();

        try {
            await onReview(selectedCard, direction);

            // Wait for fade out animation
            await new Promise(resolve => setTimeout(resolve, 150));

            // Find the current card index and show the next card
            const currentIndex = cards.findIndex(
                card => getFeedItemKey(card) === getFeedItemKey(selectedCard),
            );
            const nextIndex = currentIndex + 1;

            if (nextIndex < cards.length) {
                setSelectedCard(cards[nextIndex]);
                setIsAnimating(false);
            } else {
                // No more cards, close the dialog
                setIsDialogOpen(false);
                setSelectedCard(null);
            }
        } finally {
            setPendingCardId(null);
        }
    };

    const initialFeedState = useRef(
        (location.state as FeedLocationState | null)?.feedDialogueState,
    );

    useEffect(() => {
        const feedState = initialFeedState.current;

        // eslint-disable-next-line eqeqeq
        if (feedState == null) {
            return;
        }

        setIsDialogOpen(true);
        setSelectedCard(feedState.selectedCard);
    }, []);

    if (isLoading) {
        return (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-red-200 bg-white px-6 text-center dark:border-red-900/60 dark:bg-zinc-950">
                <Activity className="h-8 w-8 text-red-500" />
                <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
                    {errorMessage ?? t('queue_error')}
                </p>
                <Button className="mt-5 cursor-pointer" onClick={onRetry}>
                    {t('retry')}
                </Button>
            </div>
        );
    }

    if (cards.length === 0) {
        return <FeedEmptyState />;
    }

    return (
        <>
            <div className="flex gap-2 overflow-x-auto pb-4">
                {cards.map(card => {
                    const badgeLabel = card.isRequest
                        ? t('requests_badge')
                        : card.isExtendedNetwork
                          ? t('extended_network')
                          : null;
                    const avatarUrl = card.details.avatar
                        ? createFileLink(card.details.avatar)
                        : '';

                    return (
                        <div
                            key={getFeedItemKey(card)}
                            className="shrink-0 w-48 cursor-pointer"
                            onClick={() => handleCardClick(card)}
                        >
                            <div className="flex flex-col items-center gap-3 bg-white dark:bg-zinc-950 hover:bg-zinc-50 hover:dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm transition-colors min-h-58">
                                <StyledAvatar
                                    avatarClassName="w-16 h-16 border border-zinc-200 dark:border-zinc-800"
                                    src={avatarUrl}
                                    nickname={card.details.nickname}
                                    fallbackClassName="text-sm font-semibold"
                                />
                                <div className="text-center min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                        {card.details.nickname}
                                    </h3>
                                    {badgeLabel && (
                                        <Badge
                                            variant="secondary"
                                            className="mt-1 rounded-md text-xs"
                                        >
                                            {badgeLabel}
                                        </Badge>
                                    )}
                                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 overflow-hidden text-ellipsis">
                                        {card.details.description
                                            ? truncateString(
                                                  card.details.description,
                                                  60,
                                              )
                                            : t('no_description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <StyledDialogWrapper
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                contentClassName="top-0 bottom-0 lg:top-4 lg:bottom-4 lg:rounded-2xl max-w-md max-h-none -translate-x-1/2 -translate-y-0 bg-white dark:bg-zinc-950"
            >
                {selectedCard && (
                    <FeedDialog
                        selectedCard={selectedCard}
                        isAnimating={isAnimating}
                        closeDialog={() => {
                            setIsDialogOpen(false);
                            setSelectedCard(null);
                        }}
                        isBusy={isBusy}
                        handleReview={direction => void handleReview(direction)}
                    />
                )}
            </StyledDialogWrapper>
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
        </>
    );
}
