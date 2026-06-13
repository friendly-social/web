import * as Dialog from '@radix-ui/react-dialog';
import {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface StyledDialogWrapperProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    preventDefault?: boolean;
    contentClassName?: string;
    children: ReactNode;
}

export function StyledDialogWrapper({
    open,
    onOpenChange,
    preventDefault = false,
    contentClassName,
    children,
}: StyledDialogWrapperProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-2" />
                <Dialog.Content
                    {...(preventDefault && {
                        onInteractOutside: e => e.preventDefault(),
                    })}
                    className={cn(
                        'z-2 fixed left-1/2 top-1/2 -translate-x-1/2 w-full max-w-lg max-h-dvh overflow-y-auto',
                        contentClassName,
                    )}
                >
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
