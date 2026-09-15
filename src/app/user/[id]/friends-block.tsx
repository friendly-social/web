import {FriendCard} from './friend-card';
import {useNavigationType, NavigationType} from 'react-router';
import {useVirtualizer, VirtualItem} from '@tanstack/react-virtual';
import {AllFriendsList} from './all-friends-list';
import {Link} from 'react-router';
import {useTranslations} from 'use-intl';
import {useEffect, useState, ReactElement, useRef, useMemo} from 'react';
import {UserDetails} from '@/types/user-details';

export interface FriendsBlockProps {
    friends: UserDetails[];
    id: number;
}

export function FriendsBlock({friends, id}: FriendsBlockProps) {
    const t = useTranslations('profile.common-friends');
    const [showAll, setShowAll] = useState(false);

    const items = friends.map(friend => ({
        key: friend.id.toString(),
        Component: <FriendCard friend={friend} />,
    }));

    return (
        <>
            <div className="w-full flex flex-col gap-2">
                <p className="flex flex-row gap-2 mb-2">
                    <span className="flex-1 text-sm font-semibold uppercase text-foreground">
                        {t('title')}
                    </span>
                    <Link
                        to="#"
                        className="text-sm text-muted-foreground font-normal hover:underline"
                        hidden={friends.length < 1}
                        onClick={() => setShowAll(true)}
                    >
                        {t('see-all')}
                    </Link>
                </p>
                <List items={items} id={id} />
            </div>
            <AllFriendsList
                friends={friends}
                open={showAll}
                setOpen={setShowAll}
            />
        </>
    );
}

interface Item {
    key: string;
    Component: ReactElement;
}

interface ListProps {
    items: Item[];
    id: number;
}

interface ScrollState {
    initialOffset: number;
    initialMeasurementsCache: VirtualItem[];
}

function List({items, id}: ListProps) {
    const parentRef = useRef(null);

    const navigationType = useNavigationType();
    const saved = useMemo(() => {
        if (navigationType !== NavigationType.Pop) {
            return null;
        }
        return JSON.parse(
            sessionStorage.getItem(`user.${id}.scroll`) ?? 'null',
        ) as ScrollState;
    }, [navigationType]);

    const virtualizer = useVirtualizer({
        count: items.length,
        horizontal: true,
        getItemKey: index => items[index].key,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
        overscan: useOverscanAnimation(10),
        initialOffset: saved?.initialOffset,
        initialMeasurementsCache: saved?.initialMeasurementsCache,
        onChange: virtualizer => {
            if (virtualizer.isScrolling) return;
            sessionStorage.setItem(
                `user.${id}.scroll`,
                JSON.stringify({
                    initialOffset: virtualizer.scrollOffset,
                    initialMeasurementsCache: virtualizer.measurementsCache,
                }),
            );
        },
    });

    const virtualItems = virtualizer.getVirtualItems();
    const start = virtualItems[0]?.start ?? 0;
    const end = virtualItems[virtualItems.length - 1]?.end ?? 0;
    const paddingLeft = start;
    const paddingRight = virtualizer.getTotalSize() - end;

    return (
        <div
            ref={parentRef}
            className="w-full pb-4 overflow-x-auto scrollbar-none"
        >
            <div
                ref={parentRef}
                className="flex flex-row"
                style={{
                    width: `${virtualizer.getTotalSize()}px`,
                    paddingLeft: `${paddingLeft}px`,
                    paddingRight: `${paddingRight}px`,
                }}
            >
                {virtualizer.getVirtualItems().map(item => (
                    <div
                        key={item.key}
                        ref={virtualizer.measureElement}
                        data-index={item.index}
                        className="pe-2"
                    >
                        {items[item.index].Component}
                    </div>
                ))}
            </div>
        </div>
    );
}

function useOverscanAnimation(target: number): number {
    const [overscan, setOverscan] = useState(0);
    useEffect(() => {
        if (overscan >= target) return;
        const callback = setTimeout(() => {
            setOverscan(value => value + 1);
        }, 100);
        return () => clearTimeout(callback);
    }, [overscan]);
    return overscan;
}
