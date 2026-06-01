
import { useBackend } from '@/backend.context';
import { AvatarImage, AvatarFallback, Avatar } from '@/components/ui/avatar';
import { createFileLink } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Activity, Loader2 } from 'lucide-react';
import { useTranslations } from 'use-intl';
import {  useMemo } from 'react';
import { UserDetails } from '@/types/user-details';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUserAccessHashes } from '@/components/useraccesshashes-provider';
import { useParams } from 'react-router';
import { ProfileDescription } from '@/components/profile-description';

function ProfileHeader({userDetails}: {userDetails: UserDetails}) {
    const avatarUrl = useMemo(
        () => (userDetails?.avatar ? createFileLink(userDetails.avatar) : ''),
        [userDetails],
    );

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full p-4 sm:p-8">
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

                <ProfileDescription description={userDetails?.description ?? ''} />
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

export default function UserPage() {
    const t = useTranslations('profile');
    const backend = useBackend();
    const userAccessHashes = useUserAccessHashes();

    const {id} = useParams();

    const userQuery = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            if (!id) return Promise.reject(new Error('Id is null or undefined'));
            const idNum = parseInt(id);
            const userPair = await userAccessHashes.service.get(idNum);
            const accessHash = userPair.accessHash;
            return backend.getUserDetailsById(parseInt(id), accessHash);
        },
    });

    let content;

    if (userQuery.isLoading) {
        content = (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
            </div>
        );
    } else if (userQuery.isError || !userQuery.data?.ok) {
        content = (
            <div className="flex flex-col h-[50vh] gap-4 w-full items-center justify-center">
                <Activity className="h-10 w-10 animate-pulse text-foreground/80" />
                <h3>{userQuery.error?.message ?? t('unknown_error')}</h3>
            </div>
        );
    } else {
        content = (
            <div className="flex flex-col gap-2 pb-12">
                <ProfileHeader userDetails={userQuery.data.data} />
                <Separator className="dark:bg-zinc-800" />

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 flex flex-col gap-8 p-8 min-w-0">
                        <InterestsBlock interests={userQuery.data.data?.interests ?? []} />
                    </div>
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
