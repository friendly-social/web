
import {useBlockingQR, BlockingQR} from '@/app/blocking-qr/dialog';
import {useAppContext, useAppContextRef} from '@/app.context';
import {UserDetails} from '@/types/user-details';
import {FeedItem} from '@/network/friendly-client';
import {useEffect, useMemo, useState, useCallback, useRef} from 'react';
import {toast} from 'sonner';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import QRCode from 'react-qr-code';
import {
    Activity,
    Check,
    Copy,
    Heart,
    Loader2,
    LogOut,
    Pencil,
    QrCodeIcon,
    X,
    RotateCcw,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Link, useNavigate} from 'react-router';
import {useBackend} from '@/backend.context';
import {formatNetworkError} from '@/services/backend-service';
import {
    cn,
    createFileLink,
    createFriendInviteLink,
    truncateString,
} from '@/lib/utils';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useSession} from '@/components/session-provider';
import {useTranslations} from 'use-intl';
import {EditProfileDialog} from '@/app/edit/dialog';
import * as Dialog from '@radix-ui/react-dialog';
import { useUserAccessHashes } from '@/components/useraccesshashes-provider';

type SwipeDirection = 'left' | 'right';

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

function FeedReviewDeck({
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
    const userEmail = useMemo(() => localStorage.getItem('notNotifyEmail') === 'true' ?
        '_' : app.userDetails?.email, [app.userDetails]);
    const countReviewRef = useRef(0);
    const [emailBindingStatus, setEmailBindingStatus] = useState(0);

    const handleDeclineEmailBinding = () => {
        setEmailBindingStatus(0);
        localStorage.setItem('notNotifyEmail', 'true');
    }

    const handleCardClick = (card: FeedItem) => {
        setSelectedCard(card);
        setIsDialogOpen(true);
    };

    const handleReview = async (direction: SwipeDirection) => {
        if (!selectedCard || isBusy) return;

        setPendingCardId(getFeedItemKey(selectedCard));
        setIsAnimating(true);

        // eslint-disable-next-line eqeqeq
        if (userEmail == null) {
             countReviewRef.current = countReviewRef.current + 1;
             if (countReviewRef.current === 20)
                setEmailBindingStatus(1);
        }

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
	                                                    void handleReview('left')
	                                                }
	                                            >
                                                <X className="h-5 w-5 mr-2" />
                                                {t('skip')}
                                            </Button>
	                                            <Button
	                                                className="flex-1 h-12 cursor-pointer"
	                                                disabled={isBusy}
	                                                onClick={() =>
	                                                    void handleReview('right')
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

            {/* Email binding after 20 swipes */}
            <Dialog.Root open={emailBindingStatus === 1} onOpenChange={() => setEmailBindingStatus(0)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-fit max-w-sm rounded-2xl p-6 bg-white dark:bg-zinc-950 shadow-lg">
                        <>
                            <h2 className="text-center">{t('email_binding.description')}</h2>
                            <div className="flex flex-row gap-2 mt-4">
                                <Button onClick={() => setEmailBindingStatus(2)}>{t('email_binding.confirm')}</Button>
                                <Button onClick={() => setEmailBindingStatus(0)}>{t('email_binding.later')}</Button>
                                <Button onClick={handleDeclineEmailBinding}>{t('email_binding.decline')}</Button>
                            </div>
                        </>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            <EditProfileDialog open={emailBindingStatus === 2} setOpen={() => setEmailBindingStatus(0)} />
        </>
    );
}

function ProfileHeader({logOut}: {logOut: () => void}) {
    const t = useTranslations('profile');
    const app = useAppContext();
    const userDetails = app.userDetails;

    const [expanded, setExpanded] = useState(false);

    const avatarUrl = useMemo(
        () => (userDetails?.avatar ? createFileLink(userDetails.avatar) : ''),
        [userDetails],
    );

    const [openEdit, setOpenEdit] = useState(false);
    const onEditClick = useCallback(() => setOpenEdit(true), []);

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full p-4 sm:p-8">
            {userDetails && (
                <EditProfileDialog open={openEdit} setOpen={setOpenEdit} />
            )}

            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-white dark:border-zinc-800 shadow-sm">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>
                        {userDetails?.nickname?.slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
            </div>

            <div className="flex flex-1 flex-col gap-2 min-w-0 items-center sm:items-start">
                <p className="font-bold text-xl sm:text-2xl dark:text-zinc-100 truncate">
                    {userDetails?.nickname}
                </p>

                <p
                    className={cn(
                        'text-neutral-700 dark:text-zinc-400 wrap-break-word whitespace-pre-wrap transition-all duration-300 ease-in-out',
                        !expanded && 'line-clamp-4 sm:line-clamp-3',
                    )}
                >
                    {userDetails?.description}
                </p>

                <button
                    onClick={() => setExpanded(v => !v)}
                    className="mt-1 flex items-center gap-1 text-sm text-blue-500 hover:underline cursor-pointer"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" /> Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" /> Show more
                        </>
                    )}
                </button>
            </div>

            <div className="flex sm:flex-col gap-2 sm:ml-auto w-full sm:w-auto">
                <Button
                    className="cursor-pointer flex-1 sm:flex-none"
                    variant="secondary"
                    onClick={onEditClick}
                >
                    <Pencil className="w-4 h-4" />
                    <p className="hidden sm:block">{t('edit_profile')}</p>
                </Button>

                <Button
                    className="cursor-pointer flex-1 sm:flex-none"
                    variant="secondary"
                    onClick={logOut}
                >
                    <LogOut className="w-4 h-4" />
                    <p className="hidden sm:block">{t('log_out')}</p>
                </Button>
            </div>
        </div>
    );
}

function InterestsBlock({interests}: {interests: string[]}) {
    const t = useTranslations('profile');

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase mb-2 text-zinc-900 dark:text-zinc-100">
                {t('interests')}
            </h3>
            <div className="flex flex-row gap-2 flex-wrap">
                {interests.map(interest => (
                    <Badge
                        key={interest}
                        variant="secondary"
                        className="dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                        {interest}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

function FriendCard({friend}: {friend: UserDetails}) {
    const userAccessHashes = useUserAccessHashes();

    const avatarUrl = useMemo(
        () => (friend.avatar ? createFileLink(friend.avatar) : ''),
        [friend],
    );

    const openFriendPage = async () => {
        await userAccessHashes.service.save({
            id: friend.id,
            accessHash: friend.accessHash,
        });
        document.location.href = `/user/${friend.id}`;
    };

    return (
        <button onClick={() => void openFriendPage()}>
            <div className="w-40 h-50 flex flex-col items-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-200 hover:dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xs cursor-pointer">
                <Avatar className="w-16 h-16">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>
                        {friend?.nickname.toString().slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {friend?.nickname}
                </p>
                <p className="text-sm text-neutral-500 dark:text-zinc-400 text-center">
                    {friend?.description.substring(0, 16)}
                    ...
                </p>
            </div>
        </button>
    );
}

function FriendsBlock({friends}: {friends: UserDetails[]}) {
    const t = useTranslations('profile');

    return (
        <div className="flex flex-col gap-2">
            <h3 className="flex flex-row gap-2 mb-2">
                <p className="flex-1 text-sm font-semibold uppercase text-zinc-900 dark:text-zinc-100">
                    {t('friends.title')}
                </p>
                <Link
                    to="#"
                    className="text-sm text-neutral-700 dark:text-zinc-400 font-normal hover:underline"
                    hidden={friends.length < 1}
                >
                    {t('friends.see_all')}
                </Link>
            </h3>
            <div className="flex flex-row gap-2 flex-nowrap">
                {friends.slice(0, 3).map(friend => (
                    <FriendCard key={friend.id} friend={friend} />
                ))}
                <p hidden={friends.length > 0}>{t('friends.no_friends')}</p>
            </div>
        </div>
    );
}

function DiscoveryFeedBlock() {
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
        [backend],
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

function QrCodeCard({url}: {url: string | null}) {
    const t = useTranslations('profile');
    const queryClient = useQueryClient();

    return (
        <div className="md:w-1/4 md:h-fit md:mt-4 md:mr-8 flex flex-col items-center md:items-start p-4 md:rounded-xl md:border md:border-zinc-200 dark:md:border-zinc-800 md:bg-white dark:md:bg-zinc-900 text-sm">
            <div className="flex flex-col gap-2 pl-2 pt-2 pr-2">
                <div className="flex flex-row gap-2 items-center font-medium text-zinc-900 dark:text-zinc-100">
                    <QrCodeIcon className="w-4 h-4" /> {t('qr.title')}
                </div>
                <p className="text-neutral-700 dark:text-zinc-400">
                    {t('qr.desc')}
                </p>
            </div>
            <div className="h-6 md:h-2" />
            <div className="w-full flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl border border-zinc-200">
                    {url ? (
                        <QRCode value={url} className="w-32 h-32" />
                    ) : (
                        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
                    )}
                </div>
                <div className="h-2" />
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 dark:bg-zinc-950 dark:hover:bg-zinc-800 cursor-pointer"
                        onClick={() => {
                            void navigator.clipboard.writeText(url ?? '');
                            toast.success(t('qr.copied'));
                        }}
                    >
                        <Copy className="w-4 h-4 mr-2" /> {t('qr.copy')}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 dark:bg-zinc-950 dark:hover:bg-zinc-800 cursor-pointer"
                        onClick={() => {
                            void queryClient.invalidateQueries({
                                queryKey: ['inviteToken'],
                            });
                        }}
                    >
                        <RotateCcw className="s-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    const t = useTranslations('profile');

    const app = useAppContext();
    const appRef = useAppContextRef();
    const navigate = useNavigate();
    const backend = useBackend();
    const session = useSession();
    const blockingQR = useBlockingQR();

    useEffect(() => {
        if (session.status === 'guest') void navigate('/sign-up');
    }, [session.status]);

    const logOut = () => {
        session.logOut();
        void navigate('/sign-up');
    };

    const userQuery = useQuery({
        queryKey: ['userDetails'],
        queryFn: () => backend.getUserDetails(),
        enabled: session.status === 'authed',
    });

    const inviteQuery = useQuery({
        queryKey: ['inviteToken'],
        queryFn: () => backend.generateFriendInvitationToken(),
        enabled: session.status === 'authed',
        refetchOnWindowFocus: false,
    });

    const networkQuery = useQuery({
        queryKey: ['networkDetails', blockingQR],
        queryFn: () => backend.getNetworkDetails(),
        enabled: session.status === 'authed',
    });

    const userResult = userQuery.data ?? null;
    const inviteResult = inviteQuery.data ?? null;
    const networkResult = networkQuery.data ?? null;

    useEffect(() => {
        if (userResult?.ok) {
            appRef.current.setUserDetails(userResult.data);
        }
    }, [appRef, userResult]);

    const hasResultError =
        (userResult && !userResult.ok) ||
        (inviteResult && !inviteResult.ok) ||
        (networkResult && !networkResult.ok);

    const errorMessage =
        userResult && !userResult.ok
            ? formatNetworkError(userResult.error)
            : inviteResult && !inviteResult.ok
                ? formatNetworkError(inviteResult.error)
                : networkResult && !networkResult.ok
                    ? formatNetworkError(networkResult.error)
                    : null;

    const isLoading =
        session.status === 'loading' ||
        userQuery.isLoading ||
        inviteQuery.isLoading;
    const isError = userQuery.isError || inviteQuery.isError || hasResultError;

    const user = app.userDetails;
    const inviteToken = inviteResult?.ok ? inviteResult.data : null;
    const friends = networkResult?.ok ? networkResult.data.friends : [];

    const qrCodeUrl = useMemo(
        () =>
            user?.id && inviteToken
                ? createFriendInviteLink(user.id, inviteToken)
                : null,
        [inviteToken, user],
    );

    let content;

    if (session.status === 'guest') {
        content = null;
    } else if (blockingQR.shouldBlock) {
        content = (
            <>
                <BlockingQR controller={blockingQR} />
            </>
        );
    } else if (isLoading) {
        content = (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
            </div>
        );
    } else if (isError) {
        content = (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse text-foreground/80" />
                <h3>{errorMessage ?? t('unknown_error')}</h3>
            </div>
        );
    } else {
        content = (
            <div className="flex flex-col gap-2 pb-12">
                <ProfileHeader logOut={logOut} />
                <Separator className="dark:bg-zinc-800" />

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 flex flex-col gap-8 p-8 min-w-0">
                        <InterestsBlock interests={user?.interests ?? []} />
                        <Separator className="my-4 dark:bg-zinc-800" />
                        <FriendsBlock friends={friends} />
                        <Separator className="dark:bg-zinc-800" />
                        <DiscoveryFeedBlock />
                    </div>
                    <QrCodeCard url={qrCodeUrl} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="mx-auto md:p-8 md:pt-8 max-w-5xl">
                <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-zinc-200 dark:md:border-zinc-800 min-h-[calc(100vh-64px)] md:min-h-0 overflow-hidden transition-colors">
                    {content}
                </div>
            </div>
        </div>
    );
}
