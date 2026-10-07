import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {User, Newspaper, MessageCircle, BookUser, Inbox} from 'lucide-react';
import {useTranslations} from 'use-intl';
import {cn} from '@/lib/utils';
import {Link, useLocation} from 'react-router';
import {ReactNode} from 'react';

interface MenuItem {
    path: string;
    title: string;
    icon: ReactNode;
    releaseTag?: string;
}

const MENURAIL_ITEMS: MenuItem[] = [
    {
        path: '/community',
        title: 'community',
        icon: <Newspaper />,
    },
    {
        path: '/feed',
        title: 'feed',
        icon: <BookUser />,
    },
    {
        path: '/activity',
        title: 'activity',
        icon: <Inbox />,
    },
    {
        path: '/chat',
        title: 'chat',
        icon: <MessageCircle />,
        releaseTag: 'Q4',
    },
    {
        path: '/profile',
        title: 'profile',
        icon: <User />,
    },
];

const MENUBAR_ITEMS: MenuItem[] = [
    {
        path: '/community',
        title: 'community',
        icon: <Newspaper className="size-icon m-2" />,
    },
    {
        path: '/feed',
        title: 'feed',
        icon: <BookUser className="size-icon m-2" />,
    },
    {
        path: '/activity',
        title: 'activity',
        icon: <Inbox className="size-icon m-2" />,
    },
    {
        path: '/chat',
        title: 'chat',
        icon: <MessageCircle className="size-icon m-2" />,
        releaseTag: 'Q4',
    },
    {
        path: '/profile',
        title: 'profile',
        icon: <User className="size-icon m-2" />,
    },
];

export function MenuRail() {
    const t = useTranslations('menu');
    const {pathname} = useLocation();

    return (
        <div className="h-full p-1 flex flex-col gap-1.5 lg:p-4 lg:min-w-55">
            {MENURAIL_ITEMS.map(item => (
                <Link key={item.path} to={item.path}>
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
                        </p>{' '}
                        <Badge hidden={!item.releaseTag} variant="secondary">
                            {item.releaseTag}
                        </Badge>
                    </Button>
                </Link>
            ))}
        </div>
    );
}

export function MenuBar() {
    const {pathname} = useLocation();

    return (
        <div className="grid grid-cols-5 gap-2 p-2 w-full max-w-md mx-auto">
            {MENUBAR_ITEMS.map(item => (
                <Link key={item.path} to={item.path} className="min-w-0 w-full">
                    <Button
                        variant="ghost"
                        className={cn(
                            'cursor-pointer w-full h-full py-1 px-1 text-xs sm:text-sm',
                            pathname === item.path &&
                                'bg-accent text-accent-foreground dark:bg-accent/50',
                        )}
                    >
                        {item.icon}
                    </Button>
                </Link>
            ))}
        </div>
    );
}
