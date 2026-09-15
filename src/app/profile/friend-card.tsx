import {UserDetails} from '@/types/user-details';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import {useMemo} from 'react';
import {createFileLink} from '@/lib/utils';
import {useNavigate} from 'react-router';
import {StyledAvatar} from '@/components/styled-avatar';
import {useTranslations} from 'use-intl';
import {MarkdownSpan} from '@/components/ui/markdown-span';

export function FriendCard({friend}: {friend: UserDetails}) {
    const t = useTranslations('profile.friends');
    const storage = useFriendlyStorage();
    const navigate = useNavigate();

    const avatarUrl = useMemo(
        () => (friend.avatar ? createFileLink(friend.avatar) : ''),
        [friend],
    );

    const openFriendPage = async () => {
        await storage.userAccessHashes.save([
            {
                id: friend.id,
                accessHash: friend.accessHash,
            },
        ]);
        await navigate(`/user/${friend.id}`);
    };

    return (
        <div
            key={friend.id}
            className="cursor-pointer"
            onClick={() => void openFriendPage()}
        >
            <div className="flex flex-col items-center bg-card hover:bg-accent rounded-xl border border-border p-4 shadow-sm transition-colors h-45 w-36">
                <StyledAvatar
                    avatarClassName="w-16 h-16"
                    src={avatarUrl}
                    nickname={friend.nickname}
                />
                <div className="h-2" />
                <p className="truncate text-xs font-semibold text-foreground max-w-full">
                    {friend.nickname}
                </p>
                <div className="h-2" />
                <div className="text-center w-full text-xs text-muted-foreground wrap-anywhere line-clamp-3">
                    <MarkdownSpan
                        text={friend.description ?? t('no_description')}
                    />
                </div>
            </div>
        </div>
    );
}
