import {useBlockingQR, BlockingQR} from '@/app/blocking-qr/dialog';
import {useAppContext, useAppContextRef} from '@/app.context';
import {useEffect, useMemo, useState, useCallback} from 'react';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Activity, Loader2, LogOut, Pencil, QrCodeIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useNavigate} from 'react-router';
import {useBackend} from '@/backend.context';
import {formatNetworkError} from '@/services/backend-service';
import {createFileLink} from '@/lib/utils';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {unwrap} from '@/network/result';
import {NetworkError} from '@/network/errors';
import {UserDetails} from '@/types/user-details';
import {NetworkDetailsResponse} from '@/network/friendly-client';
import {useSession} from '@/components/session-provider';
import {useTranslations} from 'use-intl';
import {EditProfileDialog} from '@/app/edit/dialog';
import {LogoutDialog} from '@/app/log-out-dialog';
import {ProfileDescription} from '@/components/profile-description';
import {FriendsBlock} from '@/app/friends/friends-block';
import {QrCodeDialog} from '@/app/qr-code-dialog';
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
    const [openQR, setOpenQR] = useState(false);

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full p-4 sm:p-8">
            {userDetails && (
                <EditProfileDialog open={openEdit} setOpen={setOpenEdit} />
            )}
            <QrCodeDialog open={openQR} setOpen={setOpenQR} />
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
                <Button
                    className="cursor-pointer flex-1 sm:flex-none"
                    variant="secondary"
                    onClick={() => setOpenQR(true)}
                >
                    <QrCodeIcon className="w-4 h-4" />
                    <p className="hidden sm:block">{t('qr.title')}</p>
                </Button>

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

export default function Home() {
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

    const userQuery = useQuery<UserDetails, NetworkError>({
        queryKey: ['userDetails'],
        queryFn: () => backend.getUserDetails().then(unwrap),
        enabled: session.status === 'authed',
    });

    const networkQuery = useQuery<NetworkDetailsResponse, NetworkError>({
        queryKey: ['networkDetails', blockingQR],
        queryFn: () => backend.getNetworkDetails().then(unwrap),
        enabled: session.status === 'authed',
    });

    useEffect(() => {
        if (userQuery.data) {
            appRef.current.setUserDetails(userQuery.data);
        }
    }, [appRef, userQuery.data]);

    const isLoadingError =
        (userQuery.isError && userQuery.data === undefined) ||
        (networkQuery.isError && networkQuery.data === undefined);

    const errorMessage = userQuery.error
        ? formatNetworkError(userQuery.error)
        : networkQuery.error
          ? formatNetworkError(networkQuery.error)
          : null;

    const isLoading = session.status === 'loading' || userQuery.isLoading;
    const isError = isLoadingError;

    const user = app.userDetails;
    const friends = networkQuery.data?.friends ?? [];

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
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
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
                <Separator />

                <div className="flex flex-1 flex-col gap-8 p-8 min-w-0">
                    <InterestsBlock interests={user?.interests ?? []} />
                    <Separator className="my-4" />
                    <FriendsBlock friends={friends} />
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto md:p-8 md:pt-4 max-w-5xl">
            <div className="md:bg-card md:rounded-xl md:border md:border-border min-h-[calc(100vh-64px)] md:min-h-0 overflow-hidden transition-colors">
                {content}
            </div>
        </div>
    );
}
