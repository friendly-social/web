import {useBackend} from '@/backend.context';
import {authService} from '@/services/auth-service';
import {useAppContext} from '@/app.context';
import {useQueryClient} from '@tanstack/react-query';
import {FriendsBlock} from './friends-block';
import {forceUnwrap} from '@/network/result';
import {cn} from '@/lib/utils';
import {createFileLink, normalizeLink} from '@/lib/utils';
import {useMutation, useQuery} from '@tanstack/react-query';
import {
    Activity,
    Loader2,
    UserXIcon,
    ChevronLeft,
    Ellipsis,
} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {useErrorMessage} from '@/network/error-message';
import {useMemo, useState, useEffect} from 'react';
import {UserDetails} from '@/types/user-details';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {useNavigate, useParams} from 'react-router';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import {ProfileDescription} from '@/components/profile-description';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {ConfirmationDialog} from '@/components/confirmation-dialog';
import {StyledAvatar} from '@/components/styled-avatar';

interface ProfileDropdownProps {
    showDecline: boolean;
    onDecline: () => void;
}

function ProfileDropdown({onDecline, showDecline}: ProfileDropdownProps) {
    const tProfile = useTranslations('profile');
    const tRemoveFriendDialog = useTranslations('remove-friend-dialog');

    const [isRemoveFriendDialogOpen, setIsRemoveFriendDialogOpen] =
        useState(false);

    if (!showDecline) {
        return;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="cursor-pointer">
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setIsRemoveFriendDialogOpen(true)}
                        >
                            <UserXIcon className="size-4" />
                            {tProfile('dropdown.remove_friend')}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmationDialog
                variant="default"
                icon={<UserXIcon />}
                title={tRemoveFriendDialog('title')}
                description={tRemoveFriendDialog('description')}
                actionLabel={tRemoveFriendDialog('action')}
                cancelLabel={tRemoveFriendDialog('cancel')}
                onAction={onDecline}
                open={isRemoveFriendDialogOpen}
                onOpenChange={isOpen => {
                    if (!isOpen) setIsRemoveFriendDialogOpen(isOpen);
                }}
            />
        </>
    );
}

interface ProfileHeaderProps {
    userDetails: UserDetails;
    onRequest: () => void;
    onDecline: () => void;
}

function ProfileHeader({
    userDetails,
    onRequest,
    onDecline,
}: ProfileHeaderProps) {
    const avatarUrl = useMemo(
        () => (userDetails?.avatar ? createFileLink(userDetails.avatar) : ''),
        [userDetails],
    );

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full">
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4">
                <StyledAvatar
                    avatarClassName="w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-background shadow-sm"
                    src={avatarUrl}
                    nickname={userDetails?.nickname}
                />
            </div>

            <div className="flex flex-1 flex-col gap-2 min-w-0 items-center sm:items-start">
                <p className="font-bold text-xl sm:text-2xl text-foreground truncate">
                    {userDetails?.nickname}
                </p>

                <ProfileDescription
                    description={userDetails?.description ?? ''}
                />
            </div>

            <div className="flex sm:flex-col gap-2 sm:ml-auto w-full sm:w-auto">
                <ProfileDropdown
                    showDecline={userDetails.friendship === 'friends'}
                    onDecline={onDecline}
                />
                <ActionButton userDetails={userDetails} onRequest={onRequest} />
            </div>
        </div>
    );
}

function InterestsBlock({interests}: {interests: string[]}) {
    const t = useTranslations('profile');

    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase mb-2 text-foreground">
                {t('interests')}
            </p>
            <div className="flex flex-row gap-2 flex-wrap">
                {interests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('no_interests')}
                    </p>
                ) : (
                    interests.map(interest => (
                        <Badge key={interest} variant="secondary">
                            {interest}
                        </Badge>
                    ))
                )}
            </div>
        </div>
    );
}

export default function UserPage() {
    const t = useTranslations('profile');
    const errorMessage = useErrorMessage();
    const navigate = useNavigate();
    const app = useAppContext();
    const backend = useBackend();
    const storage = useFriendlyStorage();
    const queryClient = useQueryClient();

    const {id} = useParams();
    const userId = Number(id);
    const selfId = authService.get(app)?.id;

    useEffect(() => {
        if (userId === selfId) {
            void navigate('/profile', {replace: true});
        }
    }, [userId, selfId]);

    if (userId === selfId) {
        return;
    }

    const userKey = ['user', id];

    const {mutate: declineFriend, isPending: isDeclinePending} = useMutation({
        mutationFn: async () => {
            await backend.declineFriendRequest({
                userId: userId,
                userAccessHash: (await storage.userAccessHashes.get(userId))
                    .accessHash,
            });
        },
        onSuccess: () =>
            void queryClient.invalidateQueries({
                queryKey: userKey,
            }),
    });
    const {mutate: requestFriend, isPending: isRequestPending} = useMutation({
        mutationFn: async () => {
            await backend.sendFriendRequest({
                userId: userId,
                userAccessHash: (await storage.userAccessHashes.get(userId))
                    .accessHash,
            });
        },
        onSuccess: () =>
            void queryClient.invalidateQueries({
                queryKey: userKey,
            }),
    });

    const userQuery = useQuery({
        queryKey: userKey,
        queryFn: async () => {
            if (!id) {
                throw new Error('Id is null or undefined');
            }
            const idNum = parseInt(id);
            const userPair = await storage.userAccessHashes.get(idNum);
            const accessHash = userPair.accessHash;
            const result = await backend.getUserDetailsById2(
                parseInt(id),
                accessHash,
            );
            return forceUnwrap(result);
        },
    });

    let content;

    if (userQuery.isPending || isDeclinePending || isRequestPending) {
        content = (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    } else if (userQuery.isError) {
        content = (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse text-foreground/80" />
                <p>{errorMessage(userQuery.error)}</p>
            </div>
        );
    } else {
        content = (
            <div className="flex flex-col gap-2 pb-12 p-4 sm:p-8 gap-8 w-full">
                <ProfileHeader
                    userDetails={userQuery.data.user}
                    onDecline={declineFriend}
                    onRequest={requestFriend}
                />
                <Separator />
                <InterestsBlock interests={userQuery.data.user.interests} />
                {userQuery.data.commonFriends!.length > 0 && (
                    <>
                        <Separator />
                        <FriendsBlock friends={userQuery.data.commonFriends!} />
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="mx-auto md:p-8 md:pt-0 max-w-5xl">
            <a
                className={cn(
                    'block p-2 w-full md:bg-card',
                    'md:bg-transparent',
                    'text-muted-foreground',
                )}
                onClick={() => history.back()}
            >
                <span className="flex items-center cursor-pointer hover:underline">
                    <ChevronLeft className="inline" />
                    {t('go-back')}
                </span>
            </a>
            <div className="md:bg-card md:rounded-xl md:border md:border-border overflow-hidden transition-colors">
                {content}
            </div>
        </div>
    );
}

interface ActionButtonProps {
    userDetails: UserDetails;
    onRequest: () => void;
}

function ActionButton({userDetails, onRequest}: ActionButtonProps) {
    const t = useTranslations('profile');
    if (userDetails.friendship === 'friends') {
        if (!userDetails?.socialLink) {
            return;
        }
        return (
            <Button
                variant="secondary"
                onClick={() => {
                    window.open(
                        userDetails?.socialLink
                            ? normalizeLink(userDetails?.socialLink)
                            : '#',
                        '_blank',
                    );
                }}
                className="grow-1 sm:grow-0 cursor-pointer"
            >
                {t('open_social')}
            </Button>
        );
    } else if (userDetails.friendship === 'incomingRequest') {
        return (
            <Button
                variant="secondary"
                onClick={() => onRequest()}
                className="grow-1 sm:grow-0 cursor-pointer"
            >
                {t('accept-request')}
            </Button>
        );
    } else if (userDetails.friendship === 'outgoingRequest') {
        return (
            <Button
                disabled
                variant="secondary"
                className="grow-1 sm:grow-0 cursor-pointer"
            >
                {t('request-sent')}
            </Button>
        );
    } else {
        return (
            <Button
                variant="secondary"
                onClick={() => onRequest()}
                className="grow-1 sm:grow-0 cursor-pointer"
            >
                {t('send-request')}
            </Button>
        );
    }
}
