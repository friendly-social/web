import {UserDetails} from '@/types/user-details';
import {useUserAccessHashes} from '@/components/useraccesshashes-provider';
import {useMemo} from 'react';
import {createFileLink} from '@/lib/utils';
import {useNavigate} from 'react-router';
import {StyledAvatar} from '@/components/styled-avatar';
import {useTranslations} from 'use-intl';

export function FriendCard({friend}: {friend: UserDetails}) {
    const t = useTranslations('profile.friends');
    const userAccessHashes = useUserAccessHashes();
    const navigate = useNavigate();

    const avatarUrl = useMemo(
        () => (friend.avatar ? createFileLink(friend.avatar) : ''),
        [friend],
    );

    const openFriendPage = async () => {
        await userAccessHashes.service.save({
            id: friend.id,
            accessHash: friend.accessHash,
        });
        await navigate(`/user/${friend.id}`);
    };

    return (
        <div
            key={friend.id}
            className="shrink-0 w-45 cursor-pointer"
            onClick={() => void openFriendPage()}
        >
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-zinc-950 hover:bg-zinc-50 hover:dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm transition-colors h-58">
                <StyledAvatar
                    avatarClassName="w-16 h-16"
                    src={avatarUrl}
                    nickname={friend.nickname}
                />
                <div className="flex flex-col flex-1 items-center min-w-0 w-full min-h-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50 max-w-full">
                        {friend.nickname}
                    </h3>
                    <p className="text-center mt-2 w-full text-xs text-zinc-600 dark:text-zinc-400 wrap-anywhere line-clamp-3">
                        {friend.description
                            ? friend.description
                            : t('no_description')}
                    </p>
                </div>
            </div>
        </div>
    );
}
