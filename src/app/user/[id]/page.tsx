import {useBackend} from '@/backend.context';
import {cn} from '@/lib/utils';
import {createFileLink, normalizeLink} from '@/lib/utils';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Activity, Loader2, UserXIcon, ChevronLeft} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {useMemo, useState} from 'react';
import {UserDetails} from '@/types/user-details';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {useUserAccessHashes} from '@/components/useraccesshashes-provider';
import {useNavigate, useParams} from 'react-router';
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
import {unwrap} from '@/network/result';

interface ProfileDropdownProps {
    onRemoveFriend: () => void;
}

function ProfileDropdown({onRemoveFriend}: ProfileDropdownProps) {
    const tProfile = useTranslations('profile');
    const tRemoveFriendDialog = useTranslations('remove-friend-dialog');

    const [isRemoveFriendDialogOpen, setIsRemoveFriendDialogOpen] =
        useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="cursor-pointer">
                        ...
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
                onAction={onRemoveFriend}
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
    onRemoveFriend: () => void;
}

function ProfileHeader({userDetails, onRemoveFriend}: ProfileHeaderProps) {
    const t = useTranslations('profile');

    const avatarUrl = useMemo(
        () => (userDetails?.avatar ? createFileLink(userDetails.avatar) : ''),
        [userDetails],
    );

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full p-4 sm:p-8">
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
                <ProfileDropdown onRemoveFriend={onRemoveFriend} />
                {userDetails?.socialLink && (
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
                )}
            </div>
        </div>
    );
}

function InterestsBlock({interests}: {interests: string[]}) {
    const t = useTranslations('profile');

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase mb-2 text-foreground">
                {t('interests')}
            </h3>
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
    const navigate = useNavigate();
    const backend = useBackend();
    const userAccessHashes = useUserAccessHashes();

    const {id} = useParams();

    const {mutate: declineFriend, isPending: isDeclinePending} = useMutation({
        mutationFn: async () => {
            const userId = parseInt(id ?? '0');
            await backend.declineFriendRequest({
                userId: userId,
                userAccessHash: (await userAccessHashes.service.get(userId))
                    .accessHash,
            });
        },
        onSuccess: () => {
            void navigate('/');
        },
    });

    const userQuery = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            if (!id) throw new Error('Id is null or undefined');

            const idNum = parseInt(id);
            const userPair = await userAccessHashes.service.get(idNum);
            return unwrap(
                await backend.getUserDetailsById(idNum, userPair.accessHash),
            );
        },
    });

    const isLoadingError = userQuery.isError && userQuery.data === undefined;

    let content;

    if (userQuery.isLoading || isDeclinePending) {
        content = (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    } else if (isLoadingError) {
        content = (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse text-foreground/80" />
                <h3>{userQuery.error?.message ?? t('unknown_error')}</h3>
            </div>
        );
    } else if (userQuery.data) {
        content = (
            <div className="flex flex-col gap-2 pb-12">
                <ProfileHeader
                    userDetails={userQuery.data}
                    onRemoveFriend={declineFriend}
                />
                <Separator />

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 flex flex-col gap-8 p-8 min-w-0">
                        <InterestsBlock
                            interests={userQuery.data?.interests ?? []}
                        />
                    </div>
                </div>
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
            <div className="md:bg-card md:rounded-xl md:border md:border-border min-h-[calc(100vh-64px)] md:min-h-0 overflow-hidden transition-colors">
                {content}
            </div>
        </div>
    );
}
