import {Ellipsis, Trash, Pen} from 'lucide-react';
import {useAppRouter} from '@/components/app-router-provider';
import {useNavigate, useLocation} from 'react-router';
import {useTranslations} from 'use-intl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {ConfirmationDialog} from '@/components/confirmation-dialog';

type DeleteDialogState = {deleteDialog?: true} | null;

export interface DeleteDialogController {
    open: boolean;
    setOpen: (open: boolean) => Promise<void>;
}

export function useDeleteDialogController(): DeleteDialogController {
    const router = useAppRouter();
    const location = useLocation();
    const navigate = useNavigate();

    const open = !!(location.state as DeleteDialogState)?.deleteDialog;

    function setOpen(value: boolean) {
        const location = router.location();
        if (value) {
            return navigate(location, {
                state: {
                    ...(location.state as object),
                    deleteDialog: true,
                },
            }) as Promise<void>;
        } else {
            return navigate(-1) as Promise<void>;
        }
    }

    return {
        open,
        setOpen,
    };
}

export interface MainPostMenuProps {
    onEdit: () => void;
    onDelete: () => void;
    showDelete: boolean;
}

export function MainPostMenu({
    onDelete,
    onEdit,
    showDelete,
}: MainPostMenuProps) {
    const t = useTranslations('replies');
    const deleteDialog = useDeleteDialogController();

    if (!showDelete) {
        return;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Ellipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                        <DropdownMenuItem onClick={onEdit}>
                            <Pen className="size-4" />
                            {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => void deleteDialog.setOpen(true)}
                        >
                            <Trash className="size-4" />
                            {t('delete.trigger')}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmationDialog
                variant="default"
                icon={<Trash />}
                title={t('delete.title')}
                description={t('delete.description')}
                actionLabel={t('delete.action')}
                cancelLabel={t('delete.cancel')}
                onAction={onDelete}
                open={deleteDialog.open}
                onOpenChange={value => void deleteDialog.setOpen(value)}
            />
        </>
    );
}
