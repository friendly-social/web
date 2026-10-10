import * as Dialog from '@radix-ui/react-dialog';
import {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface StyledDialogWrapperProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    preventDefault?: boolean;
    popoverBackground?: boolean;
    maxContent?: boolean;
    contentClassName?: string;
    children: ReactNode;
}

export function StyledDialogWrapper({
    open,
    onOpenChange,
    preventDefault = false,
    popoverBackground = true,
    maxContent = false,
    contentClassName,
    children,
}: StyledDialogWrapperProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-xs z-2" />
                <Dialog.Content
                    {...(preventDefault && {
                        onInteractOutside: e => e.preventDefault(),
                    })}
                    className={cn(
                        'z-3 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                        'w-full max-h-dvh overflow-y-auto',
                        'sm:p-8 scrollbar-none box-border',
                        'sm:min-w-lg',
                        maxContent ? 'w-max max-w-full' : 'sm:w-lg',
                        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                    )}
                >
                    <div
                        className={cn(
                            'flex flex-col w-full mx-auto sm:rounded-2xl',
                            popoverBackground ? 'bg-popover shadow-lg' : '',
                            contentClassName,
                        )}
                    >
                        {children}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
