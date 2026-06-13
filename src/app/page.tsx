import {useBlockingQR, BlockingQR} from '@/app/blocking-qr/dialog';
import {useAppContext, useAppContextRef} from '@/app.context';
import {TopBar} from './top-bar';
import {useEffect, useMemo, useState, useCallback} from 'react';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Activity, Loader2, LogOut, Pencil} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useNavigate} from 'react-router';
import {useBackend} from '@/backend.context';
import {formatNetworkError} from '@/services/backend-service';
import {createFileLink, createFriendInviteLink} from '@/lib/utils';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useSession} from '@/components/session-provider';
import {useTranslations} from 'use-intl';
import {EditProfileDialog} from '@/app/edit/dialog';
import {LogoutDialog} from '@/app/log-out-dialog';
import {ProfileDescription} from '@/components/profile-description';
import {FriendsBlock} from '@/app/friends/friends-block';
import {DiscoveryFeedBlock} from '@/app/discovery-feed-block';
import {QrCodeCard} from '@/app/qrcode-card';
import {StyledAvatar} from '@/components/styled-avatar';

function ProfileHeader({logOut}: {logOut: () => void}) {
    const t = useTranslations('profile');
    const app = useAppContext();
    const userDetails = app.userDetails;

    const avatarUrl = useMemo(
        () => (userDetails?.avatar ? createFileLink(userDetails.avatar) : ''),
        [userDetails],
    );

    const [openEdit, setOpenEdit] = useState(false);
    const onEditClick = useCallback(() => setOpenEdit(true), []);
    const [openLogout, setOpenLogout] = useState(false);

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full p-4 sm:p-8">
            {userDetails && (
                <EditProfileDialog open={openEdit} setOpen={setOpenEdit} />
            )}
            <LogoutDialog
                open={openLogout}
                onOpenChange={setOpenLogout}
                hasEmail={!!userDetails?.email}
                onLogout={logOut}
                onBindEmail={() => {
                    setOpenLogout(false);
                    setOpenEdit(true);
                }}
            />

            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4">
                <StyledAvatar
                    avatarClassName="w-20 h-20 sm:w-24 sm:h-24 border-2 border-white dark:border-zinc-800 shadow-sm"
                    src={avatarUrl}
                    nickname={userDetails?.nickname}
                />
            </div>

            <div className="flex flex-1 flex-col gap-2 min-w-0 items-center sm:items-start">
                <p className="font-bold text-xl sm:text-2xl dark:text-zinc-100 truncate">
                    {userDetails?.nickname}
                </p>

                <ProfileDescription
                    description={userDetails?.description ?? ''}
                />
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
                    onClick={() => setOpenLogout(true)}
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

export default function Content() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <TopBar />
            <div className="h-16" />
            <Home />
        </div>
    );
}

function Home() {
    const t = useTranslations('profile');

    const app = useAppContext();
    const appRef = useAppContextRef();
    const navigate = useNavigate();
    const backend = useBackend();
    const queryClient = useQueryClient();
    const session = useSession();
    const blockingQR = useBlockingQR();

    useEffect(() => {
        if (session.status === 'guest') void navigate('/sign-up');
    }, [session.status]);

    const logOut = () => {
        queryClient.clear();
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
        <div className="mx-auto md:p-8 md:pt-4 max-w-5xl">
            <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-zinc-200 dark:md:border-zinc-800 min-h-[calc(100vh-64px)] md:min-h-0 overflow-hidden transition-colors">
                {content}
            </div>
        </div>
    );
}
