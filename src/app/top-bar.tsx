import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {X, Ellipsis} from 'lucide-react';
import {Link} from 'react-router';
import {cn} from '@/lib/utils';
import {useState} from 'react';

export interface DropdownMenuProps {
    showDesktop?: boolean;
    Content: ReactNode;
}

export interface CloseButtonProps {
    showDesktop?: boolean;
    onClick: () => void;
}

export interface TopBarContext {
    closeButton: CloseButtonProps | null;
    setCloseButton: (props: CloseButtonProps | null) => void;
    dropdownMenu: DropdownMenuProps | null;
    setDropdownMenu: (props: DropdownMenuProps | null) => void;
}

export function useTopBarContext(): TopBarContext {
    const [closeButton, setCloseButton] = useState<CloseButtonProps | null>(
        null,
    );
    const [dropdownMenu, setDropdownMenu] = useState<DropdownMenuProps | null>(
        null,
    );

    return {
        closeButton,
        setCloseButton,
        dropdownMenu,
        setDropdownMenu,
    };
}

export function TopBar({closeButton, dropdownMenu}: TopBarContext): ReactNode {
    return (
        <div className="w-full h-16 flex flex-col items-center">
            <div className="bg-card pl-safe pr-safe pt-safe flex-1 min-h-0 w-full">
                <div
                    className={cn(
                        'h-full w-full',
                        'flex p-4',
                        'flex-1 min-h-0',
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
                            className={cn(
                                'h-10 w-10 cursor-pointer block',
                                closeButton.showDesktop === false
                                    ? 'md:hidden'
                                    : '',
                            )}
                            variant="ghost"
                            onClick={closeButton.onClick}
                            tabIndex={-1}
                        >
                            <X />
                        </Button>
                    )}
                    {dropdownMenu && (
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className={cn(
                                    dropdownMenu.showDesktop === false
                                        ? 'md:hidden'
                                        : '',
                                )}
                                asChild
                            >
                                <Button
                                    variant="ghost"
                                    className="h-10 w-10 cursor-pointer"
                                >
                                    <Ellipsis />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {dropdownMenu.Content}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
            <div className="w-full h-px bg-border" />
        </div>
    );
}
