import {useEffect} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useTranslations} from 'use-intl';
import {toast} from 'sonner';
import {Loader2} from 'lucide-react';
import {useAppContext} from '@/app.context';
import {
    FeedItem,
    FeedQueueResponse,
    UserDetailsResponse,
} from '@/network/friendly-client';
import {forceUnwrap} from '@/network/result';
import {users} from '@/services/users-service';
import {SwipeDirection} from '@/app/feed/feed-dialog';
import {FeedCard} from '@/app/feed/feed-card';

export interface FeedUserState {
    from?: string;
}

interface ReviewVariables {
    card: FeedItem;
    direction: SwipeDirection;
}

function toFeedItem(response: UserDetailsResponse): FeedItem {
    const commonFriends = response.commonFriends ?? [];
    return {
        details: response.user,
        commonFriends,
        isRequest: response.user.friendship === 'incomingRequest',
        isExtendedNetwork: commonFriends.length > 0,
    };
}

export default function FeedUserPage() {
    const t = useTranslations('profile');
    const app = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const {id} = useParams();
    const userId = Number(id);
    const isValidId = Number.isSafeInteger(userId);

    const userQuery = useQuery({
        ...users.userOptions(app, userId),
        enabled: isValidId,
    });

    const reviewMutation = useMutation({
        mutationFn: async ({card, direction}: ReviewVariables) => {
            const request = {
                userId: card.details.id,
                userAccessHash: card.details.accessHash,
            };
            forceUnwrap(
                direction === 'right'
                    ? await app.backend.sendFriendRequest(request)
                    : await app.backend.declineFriendRequest(request),
            );
        },
        onSuccess: (_data, {card}) => {
            // Queue is absent when the feed wasn't opened yet
            app.queryClient.setQueryData<FeedQueueResponse>(
                ['feedQueue'],
                response =>
                    response && {
                        entries: response.entries.filter(
                            item => item.details.id !== card.details.id,
                        ),
                    },
            );
            void app.queryClient.invalidateQueries(
                users.userOptions(app, card.details.id),
            );
        },
        onError: () => toast.error(t('feed.error-connection')),
    });

    const isFailed = !isValidId || userQuery.isError;

    useEffect(() => {
        if (!isFailed) return;
        // Id deduplicates the toast in StrictMode
        toast.error(t('unknown_error'), {id: 'feed-user-error'});
        void navigate('/', {replace: true});
    }, [isFailed]);

    if (isFailed) {
        return;
    }

    if (userQuery.isPending) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const card = toFeedItem(userQuery.data);

    function handleReview(direction: SwipeDirection) {
        if (reviewMutation.isPending) return;

        reviewMutation.mutate(
            {card, direction},
            {
                onSuccess: () => {
                    const state = location.state as FeedUserState | null;
                    if (state?.from === '/activity') {
                        void navigate(-1);
                    } else {
                        void navigate('/feed', {replace: true});
                    }
                },
            },
        );
    }

    return (
        <FeedCard
            selectedCard={card}
            loading={reviewMutation.isPending}
            handleReview={handleReview}
        />
    );
}
