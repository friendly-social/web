import {useBlockingQR} from '@/app/blocking-qr/page';
import {forceUnwrap} from '@/network/result';
import {users} from '@/services/users-service';
import {useAppContext} from '@/app.context';
import {useMemo, useState, useCallback} from 'react';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Activity, Loader2, LogOut, Pencil, QrCodeIcon} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useNavigate} from 'react-router';
import {useBackend} from '@/backend.context';
import {createFileLink} from '@/lib/utils';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useSession} from '@/components/session-provider';
import {useTranslations} from 'use-intl';
import {EditProfileDialog} from '@/app/edit/dialog';
import {LogoutDialog} from '@/app/log-out-dialog';
import {ProfileDescription} from '@/components/profile-description';
import {FriendsBlock} from '@/app/profile/friends-block';
import {QrCodeDialog} from '@/app/qr-code-dialog';
import {StyledAvatar} from '@/components/styled-avatar';

function ProfileHeader({logOut}: {logOut: () => void}) {
    const t = useTranslations('profile');
    const app = useAppContext();
    const userDetails = users.self(app).data!.user;

    const avatarUrl = useMemo(
        () => (userDetails?.avatar ? createFileLink(userDetails.avatar) : ''),
        [userDetails],
    );

    const [openEdit, setOpenEdit] = useState(false);
    const onEditClick = useCallback(() => setOpenEdit(true), []);
    const [openLogout, setOpenLogout] = useState(false);
    const [openQR, setOpenQR] = useState(false);

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full">
            {userDetails && (
                <EditProfileDialog open={openEdit} setOpen={setOpenEdit} />
            )}
            <QrCodeDialog open={openQR} setOpen={setOpenQR} />
            <LogoutDialog
                open={openLogout}
                onOpenChange={setOpenLogout}
                suggestBindEmail={!userDetails?.email}
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

export function ProfilePage() {
    const t = useTranslations('profile');

    const app = useAppContext();
    const navigate = useNavigate();
    const backend = useBackend();
    const session = useSession();
    const queryClient = useQueryClient();
    const blockingQR = useBlockingQR();

    const logOut = () => {
        queryClient.clear();
        session.logOut();
        void navigate('/sign-up');
    };

    const userQuery = users.useSelf(app);

    const networkQuery = useQuery({
        queryKey: ['networkDetails', blockingQR.shouldBlock],
        queryFn: async () => forceUnwrap(await backend.getNetworkDetails()),
    });

    const user = userQuery.data;
    const friends = networkQuery.data?.friends ?? [];

    let content;

    if (userQuery.cache === 'empty' || networkQuery.isPending) {
        content = (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    } else if (userQuery.data === undefined || networkQuery === undefined) {
        content = (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse text-foreground/80" />
                <p>{t('unknown_error')}</p>
            </div>
        );
    } else {
        content = (
            <div className="flex flex-col gap-2 pb-12 p-4 sm:p-8 gap-8 w-full">
                <ProfileHeader logOut={logOut} />
                <Separator />
                <InterestsBlock interests={user?.user?.interests ?? []} />
                <Separator />
                <FriendsBlock friends={friends} />
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
