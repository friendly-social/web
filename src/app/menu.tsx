import {Button} from '@/components/ui/button';
import {useAppContext} from '@/app.context';
import {activity} from '@/services/activity-service';
import {User, Newspaper, MessageCircle, BookUser, Inbox} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {cn} from '@/lib/utils';
import {Link, useLocation} from 'react-router';
import {ReactNode} from 'react';

export function MenuRail() {
    const hasActivityUnread = useHasActivityUnread();

    return (
        <div className="h-full p-1 flex flex-col gap-1.5 lg:p-4 lg:min-w-55">
            <MenuRailItem
                path="/community"
                title="community"
                icon={<Newspaper />}
            />
            <MenuRailItem path="/feed" title="feed" icon={<BookUser />} />
            <MenuRailItem
                path="/activity"
                title="activity"
                icon={<Inbox />}
                unread={hasActivityUnread}
            />
            <MenuRailItem path="/chat" title="chat" icon={<MessageCircle />} />
            <MenuRailItem path="/profile" title="profile" icon={<User />} />
        </div>
    );
}

interface MenuRailItemProps {
    path: string;
    title: string;
    icon: ReactNode;
    unread?: boolean;
}

function MenuRailItem(item: MenuRailItemProps) {
    const {pathname} = useLocation();
    const t = useTranslations('menu');

    return (
        <Link to={item.path}>
            <Button
                variant="ghost"
                className={cn(
                    'cursor-pointer justify-start w-full',
                    pathname === item.path &&
                        'bg-accent text-accent-foreground dark:bg-accent/50',
                )}
            >
                {item.icon}{' '}
                <p className="hidden lg:block">
                    {t(item.title as Parameters<typeof t>[0])}
                </p>
                <span className="flex-1" />
                {item.unread ? (
                    <span className="h-2 w-2 bg-primary rounded-full" />
                ) : (
                    <span className="w-2" />
                )}
            </Button>
        </Link>
    );
}

export function MenuBar() {
    const hasActivityUnread = useHasActivityUnread();

    return (
        <div className="grid grid-cols-5 gap-2 p-2 w-full max-w-md mx-auto">
            <MenuBarItem
                path="/community"
                title="community"
                icon={<Newspaper className="size-icon m-2" />}
            />
            <MenuBarItem
                path="/feed"
                title="feed"
                icon={<BookUser className="size-icon m-2" />}
            />
            <MenuBarItem
                path="/activity"
                title="activity"
                icon={<Inbox className="size-icon m-2" />}
                unread={hasActivityUnread}
            />
            <MenuBarItem
                path="/chat"
                title="chat"
                icon={<MessageCircle className="size-icon m-2" />}
            />
            <MenuBarItem
                path="/profile"
                title="profile"
                icon={<User className="size-icon m-2" />}
            />
        </div>
    );
}

interface MenuBarItemProps {
    path: string;
    title: string;
    icon: ReactNode;
    unread?: boolean;
}

function MenuBarItem(item: MenuBarItemProps) {
    const {pathname} = useLocation();

    return (
        <Link to={item.path} className="min-w-0 w-full">
            <Button
                variant="ghost"
                className={cn(
                    'cursor-pointer w-full h-full py-1 px-1 text-xs sm:text-sm',
                    'relative',
                    pathname === item.path &&
                        'bg-accent text-accent-foreground dark:bg-accent/50',
                )}
            >
                {item.icon}
                {item.unread && (
                    <span
                        className={cn(
                            'absolute h-2 w-2 bg-primary rounded-full',
                            'bottom-1/2 right-1/2',
                            'translate-x-[calc(50%+12px)]',
                            'translate-y-[calc(50%-12px)]',
                        )}
                    />
                )}
            </Button>
        </Link>
    );
}

function useHasActivityUnread() {
    const app = useAppContext();
    const newUnreads = activity.useNewUnreads(app);
    return newUnreads.data && newUnreads.data.type === 'some';
}
