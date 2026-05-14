'use client';

import {useTranslations} from 'next-intl';
import {createFileLink} from '@/lib/utils';
import {EditProfileDialog} from '@/app/edit/dialog';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {LogOut, Pencil} from 'lucide-react';
import Link from 'next/link';
import {useState} from 'react';
import {UserDetails} from '@/types/user-details';

export function ProfileHeader({userDetails}: {userDetails: UserDetails}) {
    const t = useTranslations('profile');

    const avatarUrl = userDetails?.avatar
        ? createFileLink(userDetails.avatar)
        : '';

    const [openEdit, setOpenEdit] = useState(false);
    const onEditClick = () => setOpenEdit(true);

    return (
        <div className="flex flex-row gap-6 w-full p-8">
            {userDetails && (
                <EditProfileDialog
                    userDetails={userDetails}
                    open={openEdit}
                    setOpen={setOpenEdit}
                />
            )}
            <Avatar className="w-24 h-24 border-2 border-white dark:border-zinc-800 shadow-sm">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                    {userDetails?.nickname.toString().slice(0, 2)}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col gap-2">
                <p className="font-bold text-2xl dark:text-zinc-100">
                    {userDetails?.nickname}
                </p>
                <p className="text-neutral-700 dark:text-zinc-400">
                    {userDetails?.description}
                </p>
            </div>
            <div className="ml-auto flex flex-col gap-2">
                <Button
                    className="cursor-pointer"
                    variant="secondary"
                    onClick={onEditClick}
                >
                    <Pencil className="w-4 h-4" />
                    <p className="hidden sm:block">{t('edit_profile')}</p>
                </Button>
                <Button className="cursor-pointer" variant="secondary" asChild>
                    <Link href="/logOut">
                        <LogOut className="w-4 h-4" />
                        <p className="hidden sm:block">{t('log_out')}</p>
                    </Link>
                </Button>
            </div>
        </div>
    );
}
