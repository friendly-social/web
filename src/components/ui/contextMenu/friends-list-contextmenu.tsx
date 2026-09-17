import {UserDetails} from '@/types/user-details';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Popover as PopoverPrimitive} from 'radix-ui';
import {StyledAvatar} from '@/components/styled-avatar';
import {createFileLink} from '@/lib/utils';

interface FriendsListContextMenuInterface {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    coords: {x: number, y: number},
    handleSelect: (target: UserDetails) => void,
    allFriendsList: UserDetails[],
    searchText: string,
}

export const FriendsListContextMenu = ({
    open,
    onOpenChange,
    coords,
    handleSelect,
    allFriendsList,
    searchText,
}: FriendsListContextMenuInterface) => {
    const pointRef = useRef(coords);
    pointRef.current = coords;
    const virtualRef = useRef({
        getBoundingClientRect: () => DOMRect.fromRect({width: 0, height: 0, ...pointRef.current}),
    });

    const friendsDisplayCortege = useMemo<[string, React.ReactNode][]>(() => allFriendsList
            .map((friend): [string, React.ReactNode] => ([
                friend.nickname,
                (
                    <PopoverPrimitive.Close
                        key={friend.id}
                        asChild
                        onClick={() => handleSelect(friend)}
                    >
                        <div className="p-1 text-base flex gap-2 min-w-[calc(5*2.5rem)] max-w-[350px] rounded-md cursor-pointer border bg-primary text-primary-foreground hover:bg-primary/90 items-center">
                            <StyledAvatar
                                avatarClassName="w-8 h-8"
                                src={friend.avatar ? createFileLink(friend.avatar) : undefined}
                                nickname={friend.nickname}
                            />
                            <span className="min-w-0 truncate">{friend.nickname}</span>
                        </div>
                    </PopoverPrimitive.Close>
                ),
            ]))
        , [allFriendsList, handleSelect]);

    const [friendsList, setFriendsList] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        setFriendsList(friendsDisplayCortege
            .filter(([nickname]) => nickname.includes(searchText))
            .map(([, content]) => content)
            .slice(0, 10)
        );
    }, [searchText, friendsDisplayCortege]);

    useEffect(() => {
        if (open && !friendsList.length) {
            onOpenChange(false);
        }
    }, [friendsList]);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleScroll = (event: Event) => {
            if (
                event.target instanceof Node &&
                contentRef.current?.contains(event.target)
            ) {
                return;
            }
            onOpenChange(false);
        };

        window.addEventListener('scroll', handleScroll, {
            capture: true,
            passive: true,
        });
        return () =>
            window.removeEventListener('scroll', handleScroll, true);
    }, [open, onOpenChange]);

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <PopoverPrimitive.Anchor virtualRef={virtualRef} />
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    ref={contentRef}
                    side="bottom"
                    align="start"
                    onOpenAutoFocus={event => event.preventDefault()}
                    className="z-50 min-w-[calc(5*2.5rem)] max-w-[350px] origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    <div className="flex flex-col gap-[0.5] overflow-y-auto max-h-[calc(5*2.5rem)]">
                        {friendsList}
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
};
