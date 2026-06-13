import {ReactNode} from 'react';
import {cn} from '@/lib/utils';

export function TopBar(): ReactNode {
    return (
        <div
            className={cn(
                'fixed top-0 z-1 w-full h-16',
                'flex flex-col items-center',
            )}
        >
            <div
                className={cn(
                    'flex p-4',
                    'bg-white dark:bg-zinc-950',
                    'w-full grow min-h-0',
                    'items-center',
                )}
            >
                <img className="dark:hidden h-full" src="banner-light.svg" />
                <img
                    className="hidden dark:block h-full"
                    src="banner-dark.svg"
                />
            </div>
            <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800" />
        </div>
    );
}
