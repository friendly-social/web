import {UserDetails} from '@/types/user-details';
import {FriendlyClientImpl} from '@/network/friendly-client';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Activity} from 'lucide-react';
import Link from 'next/link';
import {BackendService, formatNetworkError} from '@/services/backend-service';
import {createFriendInviteLink} from '@/lib/utils';
import {FriendCard} from './friend-card';
import {QrCodeCard} from '@/app/qr-core-card';
import {getTranslations} from 'next-intl/server';
import {ProfileHeader} from '@/app/profile-header';
import {DiscoveryFeedBlock} from '@/app/discovery-feed-block';
import {requireAuthentication} from '@/lib/auth';
import {requirePassedBlockingQr} from '@/lib/blocking-qr';

async function InterestsBlock({interests}: {interests: string[]}) {
    const t = await getTranslations('profile');

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

async function FriendsBlock({friends}: {friends: UserDetails[]}) {
    const t = await getTranslations('profile');

    return (
        <div className="flex flex-col gap-2">
            <h3 className="flex flex-row gap-2 mb-2">
                <p className="flex-1 text-sm font-semibold uppercase text-zinc-900 dark:text-zinc-100">
                    {t('friends.title')}
                </p>
                <Link
                    href="#"
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

export default async function Home() {
    await requireAuthentication();
    await requirePassedBlockingQr();

    const t = await getTranslations('profile');
    const backend: BackendService = new BackendService(
        new FriendlyClientImpl(),
    );

    await backend.restoreAuthorizationIfPossible();

    const userResult = await backend.getUserDetails();
    const inviteTokenResult = await backend.generateFriendInvitationToken();
    const networkDetailsResult = await backend.getNetworkDetails();

    // TODO: Handle errors
    if (!userResult.ok || !inviteTokenResult.ok || !networkDetailsResult.ok) {
        const errorMessage =
            userResult && !userResult.ok
                ? formatNetworkError(userResult.error)
                : inviteTokenResult && !inviteTokenResult.ok
                  ? formatNetworkError(inviteTokenResult.error)
                  : networkDetailsResult && !networkDetailsResult.ok
                    ? formatNetworkError(networkDetailsResult.error)
                    : null;
        return (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse text-foreground/80" />
                <h3>{errorMessage ?? t('unknown_error')}</h3>
            </div>
        );
    }

    const user = userResult.data ?? null;
    const inviteToken = inviteTokenResult.data ?? null;
    const network = networkDetailsResult.data ?? null;
    const friends = network.friends;
    const qrCodeUrl =
        user?.id && inviteToken
            ? createFriendInviteLink(user.id, inviteToken)
            : null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <div className="mx-auto md:p-8 md:pt-8 max-w-5xl">
                <div className="bg-white dark:bg-zinc-950 md:rounded-xl md:border md:border-zinc-200 dark:md:border-zinc-800 min-h-[calc(100vh-64px)] md:min-h-0 overflow-hidden transition-colors">
                    <div className="flex flex-col gap-2 pb-12">
                        <ProfileHeader userDetails={user} />
                        <Separator className="dark:bg-zinc-800" />

                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 flex flex-col gap-8 p-8 min-w-0">
                                <InterestsBlock
                                    interests={user?.interests ?? []}
                                />
                                <Separator className="my-4 dark:bg-zinc-800" />
                                <FriendsBlock friends={friends} />
                                <Separator className="dark:bg-zinc-800" />
                                <DiscoveryFeedBlock />
                            </div>
                            <QrCodeCard url={qrCodeUrl} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
