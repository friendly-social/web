import {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {X} from 'lucide-react';
import {Link} from 'react-router';
import {cn} from '@/lib/utils';
import {useState} from 'react';

export interface CloseButtonProps {
    onClick: () => void;
}

export interface TopBarContext {
    closeButton: CloseButtonProps | null;
    setCloseButton: (props: CloseButtonProps | null) => void;
}

export function useTopBarContext(): TopBarContext {
    const [closeButton, setCloseButton] = useState<CloseButtonProps | null>(
        null,
    );

    return {
        closeButton,
        setCloseButton,
    };
}

export function TopBar({closeButton}: TopBarContext): ReactNode {
    return (
        <div className={cn('w-full h-16', 'flex flex-col items-center')}>
            <div
                className={cn(
                    'flex p-4',
                    'bg-card',
                    'w-full flex-1 min-h-0',
                    'items-center',
                )}
            >
                <Link className="h-full" to="/">
                    <img
                        className="dark:hidden h-full"
                        src="/banner-light.svg"
                    />
                    <img
                        className="hidden dark:block h-full"
                        src="/banner-dark.svg"
                    />
                </Link>
                <div className="flex-1" />
                {closeButton && (
                    <Button
                        className="h-10 w-10 ghost cursor-pointer block md:hidden"
                        variant="ghost"
                        onClick={closeButton.onClick}
                    >
                        <X />
                    </Button>
                )}
            </div>
            <div className="w-full h-px bg-border" />
        </div>
    );
}
