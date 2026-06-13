import {UserDetails} from '@/types/user-details';
import {useUserAccessHashes} from '@/components/useraccesshashes-provider';
import {useMemo} from 'react';
import {createFileLink} from '@/lib/utils';
import {useNavigate} from 'react-router';
import {StyledAvatar} from '@/components/styled-avatar';

export function FriendCard({friend}: {friend: UserDetails}) {
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
        <button onClick={() => void openFriendPage()}>
            <div className="w-40 h-50 flex flex-col items-center gap-2 bg-white dark:bg-zinc-900 hover:bg-zinc-200 hover:dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-2xs cursor-pointer">
                <StyledAvatar
                    avatarClassName="w-16 h-16"
                    src={avatarUrl}
                    nickname={friend.nickname}
                />
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {friend?.nickname}
                </p>
                <p className="text-sm text-neutral-500 dark:text-zinc-400 text-center">
                    {friend?.description.substring(0, 16)}
                    ...
                </p>
            </div>
        </button>
    );
}
