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

export function MenuRail() {
    const t = useTranslations('menu');
    const {pathname} = useLocation();

    return (
        <div className="h-full w-16 lg:w-55 shrink-0 p-1 flex flex-col gap-1.5 lg:p-4">
            {MENURAIL_ITEMS.map(item => (
                <Link key={item.path} to={item.path}>
                    <Button
                        variant="ghost"
                        className={cn(
                            'cursor-pointer justify-start w-full max-lg:justify-center',
                            pathname === item.path &&
                                'bg-accent text-accent-foreground dark:bg-accent/50',
                        )}
                    >
                        {item.icon}
                        <p className="hidden lg:block">
                            {t(item.title as Parameters<typeof t>[0])}
                        </p>
                        <Badge
                            hidden={!item.releaseTag}
                            variant="secondary"
                            className="max-lg:hidden"
                        >
                            {item.releaseTag}
                        </Badge>
                    </Button>
                </Link>
            ))}
        </div>
    );
}

export function MenuBar() {
    const t = useTranslations('menu');
    const {pathname} = useLocation();

    return (
        <div className="grid grid-cols-5 gap-1 px-2 pt-1.5 w-full pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {MENURAIL_ITEMS.map(item => {
                const active = pathname === item.path;
                const label = t(item.title as Parameters<typeof t>[0]);
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        aria-label={label}
                        aria-current={active ? 'page' : undefined}
                        className="min-w-0 w-full"
                    >
                        <Button
                            variant="ghost"
                            className={cn(
                                'cursor-pointer w-full h-auto flex-col gap-0.5 px-1.5 py-2 text-[10px] leading-none',
                                active &&
                                    'bg-accent text-accent-foreground dark:bg-accent/50',
                            )}
                        >
                            <span className="relative">
                                {item.icon}
                                {item.releaseTag && (
                                    <Badge
                                        variant="secondary"
                                        className="absolute -top-1 -right-3 h-4 px-1 text-[9px]"
                                    >
                                        {item.releaseTag}
                                    </Badge>
                                )}
                            </span>
                            {label}
                        </Button>
                    </Link>
                );
            })}
        </div>
    );
}
