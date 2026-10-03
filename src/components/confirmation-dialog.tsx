import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {cn} from '@/lib/utils';

type ConfirmationDialogVariant = 'default' | 'destructive';

interface ConfirmationDialogProps {
    variant: ConfirmationDialogVariant;
    icon?: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    cancelLabel: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAction?: () => void;
    onCancel?: () => void;
}

export function ConfirmationDialog({
    variant = 'default',
    icon = undefined,
    title,
    description,
    actionLabel,
    cancelLabel,
    onAction,
    onCancel,
    ...props
}: ConfirmationDialogProps) {
    return (
        <AlertDialog {...props}>
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    {icon && (
                        <AlertDialogMedia
                            className={cn(
                                variant === 'destructive'
                                    ? 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive'
                                    : '',
                            )}
                        >
                            {icon}
                        </AlertDialogMedia>
                    )}

                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => onCancel?.()}
                        className="cursor-pointer"
                        variant="outline"
                    >
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => onAction?.()}
                        className="cursor-pointer"
                        variant={
                            variant === 'destructive'
                                ? 'destructive'
                                : 'default'
                        }
                    >
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
