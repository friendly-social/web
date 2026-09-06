import {Badge} from '@/components/ui/badge';
import {MarkdownArea} from '@/components/ui/markdown-area';
import {Button} from '@/components/ui/button';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import {cn, createFileLink} from '@/lib/utils';
import {FeedItem} from '@/network/friendly-client';
import {UserDetails} from '@/types/user-details';
import {Check, Heart, X} from 'lucide-react';
import {useNavigate} from 'react-router';
import {useTranslations} from 'use-intl';
import {StyledAvatar} from '@/components/styled-avatar';
import {AvatarGroup, AvatarGroupCount} from '@/components/ui/avatar';
import {AllFriendsList} from '@/app/profile/all-friends-list';
import {useState} from 'react';

interface FeedDialogProps {
    selectedCard: FeedItem;
    loading: boolean;
    handleReview: (direction: SwipeDirection) => void;
}

export type SwipeDirection = 'left' | 'right';

export function FeedDialog({
    selectedCard,
    loading,
    handleReview,
}: FeedDialogProps) {
    const t = useTranslations('profile.feed');
    const storage = useFriendlyStorage();
    const navigate = useNavigate();
    const [showAllFriends, setShowAllFriends] = useState(false);

    async function routeToUser(friend: UserDetails) {
        await storage.userAccessHashes.save({
            id: friend.id,
            accessHash: friend.accessHash,
        });
        await navigate(`/user/${friend.id}`);
    }

    return (
        <div
            key={selectedCard.details.id}
            className="flex flex-col min-h-full animate-fade-in"
        >
            <div className="relative w-full aspect-square shrink-0 overflow-hidden">
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-2">
                    <div className="flex justify-between flex-1">
                        <AvatarGroup className="space-x-2 ms-4">
                            {selectedCard.commonFriends
                                .slice(0, 5)
                                .map(friend => {
                                    return (
                                        <StyledAvatar
                                            avatarClassName={cn(
                                                'w-8 h-8 -ms-4',
                                                'cursor-pointer',
                                            )}
                                            key={friend.id}
                                            src={
                                                friend.avatar
                                                    ? createFileLink(
                                                          friend.avatar,
                                                      )
                                                    : undefined
                                            }
                                            nickname={friend.nickname}
                                            onClick={() =>
                                                void routeToUser(friend)
                                            }
                                        />
                                    );
                                })}
                            {selectedCard.commonFriends.length > 5 && (
                                <AvatarGroupCount
                                    className="w-8 h-8 -ms-4 cursor-pointer"
                                    onClick={() => setShowAllFriends(true)}
                                >
                                    +{selectedCard.commonFriends.length - 5}
                                </AvatarGroupCount>
                            )}
                        </AvatarGroup>
                        {(selectedCard.isRequest ||
                            selectedCard.isExtendedNetwork) && (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    'bg-secondary/50',
                                    'backdrop-blur-md border rounded-md',
                                    'text-sm px-3 py-1',
                                )}
                            >
                                {selectedCard.isRequest
                                    ? t('requests_badge')
                                    : selectedCard.isExtendedNetwork
                                      ? t('extended_network')
                                      : null}
                            </Badge>
                        )}
                        <AllFriendsList
                            friends={selectedCard.commonFriends}
                            open={showAllFriends}
                            setOpen={setShowAllFriends}
                        />
                    </div>
                </div>

                <StyledAvatar
                    avatarClassName="w-full h-full rounded-none object-cover"
                    src={
                        selectedCard.details.avatar
                            ? createFileLink(selectedCard.details.avatar)
                            : undefined
                    }
                    nickname={selectedCard.details.nickname}
                    avatarImageClassName="object-cover w-full h-full sm:rounded-tl-xl sm:rounded-tr-xl"
                    fallbackClassName={cn(
                        'text-6xl font-semibold',
                        'w-full h-full flex items-center justify-center',
                        'rounded-none sm:rounded-tl-xl sm:rounded-tr-xl',
                        'bg-muted',
                    )}
                />

                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                    {selectedCard.details.interests.map(interest => (
                        <Badge
                            key={interest}
                            variant="secondary"
                            className="px-2 py-1"
                        >
                            {interest}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="flex flex-col flex-1 shrink p-6 pb-12 relative">
                <p className="text-2xl font-semibold text-foreground mb-2">
                    {selectedCard.details.nickname}
                </p>

                <div className="break-words text-sm leading-6 text-foreground">
                    {selectedCard.details.description ? (
                        <MarkdownArea text={selectedCard.details.description} />
                    ) : (
                        <p>{t('no_description')}</p>
                    )}
                </div>
            </div>

            <div className="p-6 pt-0 relative">
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 cursor-pointer"
                        disabled={loading}
                        onClick={() => handleReview('left')}
                    >
                        <X className="h-5 w-5 mr-2" />
                        {t('skip')}
                    </Button>
                    <Button
                        className="flex-1 h-12 cursor-pointer"
                        disabled={loading}
                        onClick={() => handleReview('right')}
                    >
                        {selectedCard.isRequest ? (
                            <Check className="h-5 w-5 mr-2" />
                        ) : (
                            <Heart className="h-5 w-5 mr-2" />
                        )}
                        {selectedCard.isRequest ? t('accept') : t('connect')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
