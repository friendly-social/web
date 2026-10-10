import {useImagePreviewerController} from '@/components/image-previewer';
import {useScaffoldContext} from '@/app/scaffold';
import {useAppRouter} from '@/components/app-router-provider';
import {useBackend} from '@/backend.context';
import * as authService from '@/services/auth-service';
import {useAppContext} from '@/app.context';
import {useQueryClient} from '@tanstack/react-query';
import {FriendsBlock} from './friends-block';
import {forceUnwrap} from '@/network/result';
import {cn} from '@/lib/utils';
import {createFileLink} from '@/lib/utils';
import {useMutation, useQuery} from '@tanstack/react-query';
import {
    Activity,
    Loader2,
    UserXIcon,
    ChevronLeft,
    Ellipsis,
} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {useMemo, useLayoutEffect, useEffect} from 'react';
import {UserDetails} from '@/types/user-details';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {useNavigate, useParams, useLocation} from 'react-router';
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

    const imagePreviewer = useImagePreviewerController();

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full">
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4">
                <StyledAvatar
                    avatarClassName="w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-background shadow-sm"
                    src={avatarUrl}
                    nickname={userDetails?.nickname}
                    onImageClick={e => {
                        e.stopPropagation();
                        void imagePreviewer.setPayload({
                            type: 'open',
                            src: e.currentTarget.src,
                        });
                    }}
                />
            </div>

            <div
                className={cn(
                    'flex flex-1 flex-col gap-1 items-center w-full',
                    'sm:items-start sm:min-w-0',
                )}
            >
                <p className="font-bold text-xl sm:text-2xl text-foreground truncate md:w-full max-w-full">
                    {userDetails?.nickname}
                </p>

                <ProfileDescription
                    description={userDetails.description}
                    socialLink={userDetails.socialLink}
                />
            </div>

            <div
                className={cn(
                    'flex sm:flex-col gap-2 sm:ml-auto w-full sm:w-auto',
                    userDetails.friendship === 'friends'
                        ? 'hidden md:flex'
                        : '',
                )}
            >
                <ProfileDropdown
                    onDecline={onDecline}
                    showDecline={userDetails.friendship === 'friends'}
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
    const navigate = useNavigate();
    const app = useAppContext();

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

    return <UserPageGuarded userId={userId} />;
}

interface UserPageGuardedProps {
    userId: number;
}

function UserPageGuarded({userId}: UserPageGuardedProps) {
    'use no memo';

    const t = useTranslations('profile');
    const backend = useBackend();
    const storage = useFriendlyStorage();
    const queryClient = useQueryClient();

    const userKey = ['user', userId];

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
            const userPair = await storage.userAccessHashes.get(userId);
            const accessHash = userPair.accessHash;
            const result = await backend.getUserDetailsById2(
                userId,
                accessHash,
            );
            return forceUnwrap(result);
        },
    });

    useEffect(() => {
        console.log(
            'User statuses',
            userQuery.isPending,
            isDeclinePending,
            isRequestPending,
        );
    }, [userQuery.isPending, isDeclinePending, isRequestPending]);

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
                <p>{userQuery.error?.message ?? t('unknown_error')}</p>
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
                        <FriendsBlock
                            friends={userQuery.data.commonFriends!}
                            id={userId}
                        />
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
        return;
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

type RemoveFriendDialogState = {removeFriendDialog?: true} | null;

export interface RemoveFriendDialogController {
    open: boolean;
    setOpen: (open: boolean) => Promise<void>;
}

export function useRemoveFriendDialogController(): RemoveFriendDialogController {
    const router = useAppRouter();
    const location = useLocation();
    const navigate = useNavigate();

    const open = !!(location.state as RemoveFriendDialogState)
        ?.removeFriendDialog;

    function setOpen(value: boolean) {
        const location = router.location();
        if (value) {
            return navigate(location, {
                state: {
                    ...(location.state as object),
                    removeFriendDialog: true,
                },
            }) as Promise<void>;
        } else {
            return navigate(-1) as Promise<void>;
        }
    }

    return {
        open,
        setOpen,
    };
}

interface ProfileDropdownProps {
    showDecline: boolean;
    onDecline: () => void;
}

function ProfileDropdown({onDecline, showDecline}: ProfileDropdownProps) {
    const tProfile = useTranslations('profile');
    const tRemoveFriendDialog = useTranslations('remove-friend-dialog');

    const removeFriendDialog = useRemoveFriendDialogController();
    const topBar = useScaffoldContext().topBar;

    // some other props in the future?
    const showMenu = showDecline;

    let dropdownContent = null;

    if (showMenu) {
        dropdownContent = (
            <DropdownMenuGroup>
                <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void removeFriendDialog.setOpen(true)}
                >
                    <UserXIcon className="size-4" />
                    {tProfile('dropdown.remove_friend')}
                </DropdownMenuItem>
            </DropdownMenuGroup>
        );
    }

    useLayoutEffect(() => {
        if (dropdownContent === null) return;
        topBar.setDropdownMenu({
            showDesktop: false,
            Content: dropdownContent,
        });
        return () => topBar.setDropdownMenu(null);
    }, [dropdownContent]);

    if (!showMenu) {
        return;
    }

    return (
        <div className="hidden md:block">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="cursor-pointer">
                        <Ellipsis />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>{dropdownContent}</DropdownMenuContent>
            </DropdownMenu>

            <ConfirmationDialog
                variant="default"
                icon={<UserXIcon />}
                title={tRemoveFriendDialog('title')}
                description={tRemoveFriendDialog('description')}
                actionLabel={tRemoveFriendDialog('action')}
                cancelLabel={tRemoveFriendDialog('cancel')}
                onAction={onDecline}
                open={removeFriendDialog.open}
                onOpenChange={value => void removeFriendDialog.setOpen(value)}
            />
        </div>
    );
}
