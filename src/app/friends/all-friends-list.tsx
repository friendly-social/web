import {UserDetails} from "@/types/user-details";
import { Dialog } from "radix-ui";
import {ReactNode} from "react";
import {useTranslations} from "use-intl";
import {FriendCard} from "@/app/friends/components/friend-card";

type AllFriendsListType = {
    friends: UserDetails[],
    open: boolean,
    setOpen: (open: boolean) => void
}

export function AllFriendsList({
    friends,
    open,
    setOpen
}: AllFriendsListType): ReactNode {
    const t = useTranslations('profile');

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="
                        fixed inset-0 z-50
                        bg-black/50 backdrop-blur-sm
                    "
                />

                <Dialog.Content
                    className="
                        fixed left-1/2 top-1/2 z-50
                        -translate-x-1/2 -translate-y-1/2

                        p-5
                        max-h-dvh overflow-y-auto

                        outline-none
                    "
                >
                    <div
                        className="
                            rounded-xl bg-white dark:bg-zinc-900
                            shadow-xl
                        "
                    >
                        <div className="p-4">
                            <div className="flex flex-col">
                                <h2 className="text-md font-semibold text-left pt-2">
                                    {t('friends.see_all')}
                                </h2>

                                <div className="my-3 border-t border-border" />

                                <div
                                    className="
                                        min-h-16 max-h-[60dvh]
                                        overflow-y-auto

                                        grid grid-cols-4 gap-2
                                    "
                                >
                                    {friends.map((friend, index) => (
                                        <FriendCard key={"friend"+index} friend={friend} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
