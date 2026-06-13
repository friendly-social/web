import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {useUserAccessHashes} from '@/components/useraccesshashes-provider';
import {createFileLink} from '@/lib/utils';
import {FeedItem} from '@/network/friendly-client';
import {UserDetails} from '@/types/user-details';
import {Check, Heart, X} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {useNavigate} from 'react-router';
import {useTranslations} from 'use-intl';
import {SwipeDirection} from '@/app/feed-review-deck';
import {StyledAvatar} from '@/components/styled-avatar';

interface FeedDialogProps {
    selectedCard: FeedItem;
    isAnimating: boolean;
    isBusy: boolean;
    closeDialog: () => void;
    handleReview: (direction: SwipeDirection) => void;
}

export function FeedDialog({
    selectedCard,
    isAnimating,
    closeDialog,
    isBusy,
    handleReview,
}: FeedDialogProps) {
    const t = useTranslations('profile.feed');
    const userAccessHashes = useUserAccessHashes();
    const navigate = useNavigate();

    async function routeToUser(friend: UserDetails) {
        await userAccessHashes.service.save({
            id: friend.id,
            accessHash: friend.accessHash,
        });

        await navigate('/', {
            state: {
                feedDialogueState: {
                    selectedCard,
                }
            },
            replace: true,
        });
        await navigate(`/user/${friend.id}`);
    }

    return (
        <>
            <Dialog.Title className="sr-only">
                {selectedCard.details.nickname}
            </Dialog.Title>

            <div
                className={`flex flex-col h-full transition-opacity duration-150 ${
                    isAnimating ? 'opacity-0' : 'opacity-100'
                }`}
            >
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-2">
                    <div className="flex flex-column ms-4">
                        {(selectedCard.isRequest ||
                            selectedCard.isExtendedNetwork) && (
                            <Badge
                                variant="secondary"
                                className="bg-secondary/50 -ms-4 me-5 backdrop-blur-md border rounded-md text-sm px-3 py-1"
                            >
                                {selectedCard.isRequest
                                    ? t('requests_badge')
                                    : selectedCard.isExtendedNetwork
                                      ? t('extended_network')
                                      : null}
                            </Badge>
                        )}
                        {selectedCard.commonFriends.slice(0, 5).map(friend => {
                            return (
                                <StyledAvatar
                                    avatarClassName="w-10 h-10 -ms-4 border-2 border-white dark:border-zinc-800 cursor-pointer"
                                    src={
                                        friend.avatar
                                            ? createFileLink(friend.avatar)
                                            : undefined
                                    }
                                    nickname={friend.nickname}
                                    onClick={() => void routeToUser(friend)}
                                />
                            );
                        })}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full bg-black/20 hover:bg-black/40 text-white"
                        onClick={() => closeDialog()}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="relative w-full aspect-square shrink-0 overflow-hidden">
                    <StyledAvatar
                        avatarClassName="w-full h-full rounded-none object-cover"
                        src={
                            selectedCard.details.avatar
                                ? createFileLink(selectedCard.details.avatar)
                                : undefined
                        }
                        nickname={selectedCard.details.nickname}
                        avatarImageClassName="object-cover w-full h-full"
                        fallbackClassName="text-6xl font-semibold w-full h-full flex items-center justify-center rounded-none bg-zinc-200 dark:bg-zinc-800"
                    />

                    <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2">
                        {selectedCard.details.interests.map(interest => (
                            <Badge
                                key={interest}
                                variant="secondary"
                                className="px-2 py-1 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            >
                                {interest}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col flex-1 shrink p-6 pb-12 relative">
                    <h3 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50 mb-2">
                        {selectedCard.details.nickname}
                    </h3>

                    <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                        {selectedCard.details.description ||
                            t('no_description')}
                    </p>
                </div>

                <div className="p-6 pt-0 relative">
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 cursor-pointer"
                            disabled={isBusy}
                            onClick={() => handleReview('left')}
                        >
                            <X className="h-5 w-5 mr-2" />
                            {t('skip')}
                        </Button>
                        <Button
                            className="flex-1 h-12 cursor-pointer"
                            disabled={isBusy}
                            onClick={() => handleReview('right')}
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
    );
}
