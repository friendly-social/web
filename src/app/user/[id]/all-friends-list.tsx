import {UserDetails} from '@/types/user-details';
import {useMemo} from 'react';
import {useTranslations} from 'use-intl';
import {cn, createFileLink} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {X} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {useFriendlyStorage} from '@/components/friendly-storage-provider';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {StyledAvatar} from '@/components/styled-avatar';
import {useNavigate} from 'react-router';

interface AllFriendsListProps {
    friends: UserDetails[];
    open: boolean;
    setOpen: (open: boolean) => void;
}

interface FriendListItemProps {
    id: string;
    friend: UserDetails;
    onClick: () => void;
}

function FriendListItem({id, friend, onClick}: FriendListItemProps) {
    const avatarUrl = useMemo(
        () => (friend.avatar ? createFileLink(friend.avatar) : ''),
        [friend],
    );

    return (
        <button
            id={id}
            onClick={onClick}
            className={cn(
                'p-2 grow-1 flex flex-row',
                'items-center gap-4 rounded-xl',
                'cursor-pointer',
                'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
            )}
        >
            <StyledAvatar
                avatarClassName="w-12 h-12"
                src={avatarUrl}
                nickname={friend.nickname}
            />
            <p className="text-sm font-semibold text-foreground">
                {friend?.nickname}
            </p>
        </button>
    );
}

export function AllFriendsList({friends, open, setOpen}: AllFriendsListProps) {
    const t = useTranslations('profile');
    const storage = useFriendlyStorage();
    const navigate = useNavigate();

    const openFriendPage = async (friend: UserDetails) => {
        await storage.userAccessHashes.save([
            {
                id: friend.id,
                accessHash: friend.accessHash,
            },
        ]);
        await navigate(`/user/${friend.id}`);
    };

    return (
        <StyledDialogWrapper open={open} onOpenChange={setOpen}>
            <div>
                <div className="p-0">
                    <div className="flex flex-col">
                        <div className="relative flex items-center mt-1 mx-1">
                            <Dialog.Title className="w-full text-base font-semibold text-center pt-2">
                                {t('friends.see-all')}
                            </Dialog.Title>
                            <Dialog.Close
                                className="absolute right-0 top-0"
                                asChild
                            >
                                <Button
                                    variant="ghost"
                                    className="cursor-pointer"
                                >
                                    <X />
                                </Button>
                            </Dialog.Close>
                        </div>

                        <div className="flex flex-col p-2">
                            {friends.map(friend => (
                                <FriendListItem
                                    id={friend.id.toString()}
                                    key={friend.id}
                                    friend={friend}
                                    onClick={() => {
                                        setOpen(false);
                                        void openFriendPage(friend);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </StyledDialogWrapper>
    );
}
