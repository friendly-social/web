'use client';

import {FeedItem} from '@/network/friendly-client';
import {useTranslations} from 'next-intl';
import {Activity, Check, Heart, Loader2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {FeedEmptyState} from '@/app/feed-empty-state';
import {createFileLink, truncateString} from '@/lib/utils';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import * as Dialog from '@radix-ui/react-dialog';
import {useState} from 'react';

type SwipeDirection = 'left' | 'right';

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
    function getFeedItemKey(item: FeedItem) {
        return `${item.details.id}-${item.isRequest ? 'request' : 'suggested'}`;
    }

    const t = useTranslations('profile.feed');
    const [selectedCard, setSelectedCard] = useState<FeedItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [pendingCardId, setPendingCardId] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const isBusy = pendingCardId !== null;

    const handleCardClick = (card: FeedItem) => {
        setSelectedCard(card);
        setIsDialogOpen(true);
    };

    const handleReview = async (direction: SwipeDirection) => {
        if (!selectedCard || isBusy) return;

        setPendingCardId(getFeedItemKey(selectedCard));
        setIsAnimating(true);

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
                                <Avatar className="w-16 h-16 border border-zinc-200 dark:border-zinc-800">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="text-sm font-semibold">
                                        {card.details.nickname
                                            .slice(0, 2)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
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

            <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-0 bottom-0 lg:top-4 lg:bottom-4 w-full lg:rounded-2xl md:max-w-md lg:max-w-lg -translate-x-1/2 overflow-y-auto bg-white dark:bg-zinc-950">
                        {selectedCard && (
                            <>
                                <Dialog.Title className="sr-only">
                                    {selectedCard.details.nickname}
                                </Dialog.Title>

                                <div
                                    className={`flex flex-col h-full transition-opacity duration-150 ${
                                        isAnimating
                                            ? 'opacity-0'
                                            : 'opacity-100'
                                    }`}
                                >
                                    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-2">
                                        <div>
                                            {(selectedCard.isRequest ||
                                                selectedCard.isExtendedNetwork) && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-secondary/50 backdrop-blur-md border rounded-md text-sm px-3 py-1"
                                                >
                                                    {selectedCard.isRequest
                                                        ? t('requests_badge')
                                                        : selectedCard.isExtendedNetwork
                                                          ? t(
                                                                'extended_network',
                                                            )
                                                          : null}
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                            onClick={() => {
                                                setIsDialogOpen(false);
                                                setSelectedCard(null);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="relative w-full aspect-square shrink-0 overflow-hidden">
                                        <Avatar className="w-full h-full rounded-none object-cover">
                                            <AvatarImage
                                                src={
                                                    selectedCard.details.avatar
                                                        ? createFileLink(
                                                              selectedCard
                                                                  .details
                                                                  .avatar,
                                                          )
                                                        : undefined
                                                }
                                                className="object-cover w-full h-full"
                                            />
                                            <AvatarFallback className="text-6xl font-semibold w-full h-full flex items-center justify-center rounded-none bg-zinc-200 dark:bg-zinc-800">
                                                {selectedCard.details.nickname
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2">
                                            {selectedCard.details.interests.map(
                                                interest => (
                                                    <Badge
                                                        key={interest}
                                                        variant="secondary"
                                                        className="px-2 py-1 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                                    >
                                                        {interest}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col flex-1 p-6">
                                        <h3 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50 mb-2">
                                            {selectedCard.details.nickname}
                                        </h3>

                                        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                                            {selectedCard.details.description ||
                                                t('no_description')}
                                        </p>
                                    </div>

                                    <div className="p-6 pt-0">
                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-12 cursor-pointer"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleReview('left')
                                                }
                                            >
                                                <X className="h-5 w-5 mr-2" />
                                                {t('skip')}
                                            </Button>
                                            <Button
                                                className="flex-1 h-12 cursor-pointer"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleReview('right')
                                                }
                                            >
                                                {selectedCard.isRequest ? (
                                                    <Check className="h-5 w-5 mr-2" />
                                                ) : (
                                                    <Heart className="h-5 w-5 mr-2" />
                                                )}
                                                {selectedCard.isRequest
                                                    ? t('accept')
                                                    : t('connect')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
