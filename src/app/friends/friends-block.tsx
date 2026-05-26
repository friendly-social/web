import {UserDetails} from "@/types/user-details";
import {useTranslations} from "use-intl";
import {Link} from "react-router";
import React, {useState} from "react";
import {FriendCard} from "./components/friend-card";
import {AllFriendsList} from "@/app/friends/all-friends-list";

export function FriendsBlock({friends}: {friends: UserDetails[]}) {
    const t = useTranslations('profile');
    const [showAll, setShowAll] = useState(false);

    return (
        <>
        <div className="flex flex-col gap-2">
            <h3 className="flex flex-row gap-2 mb-2">
                <p className="flex-1 text-sm font-semibold uppercase text-zinc-900 dark:text-zinc-100">
                    {t('friends.title')}
                </p>
                <Link
                    to="#"
                    className="text-sm text-neutral-700 dark:text-zinc-400 font-normal hover:underline"
                    hidden={friends.length < 1}
                    onClick={() => setShowAll(true)}
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
            <AllFriendsList friends={friends} open={showAll} setOpen={setShowAll} />
        </>
    );
}
