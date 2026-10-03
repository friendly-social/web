import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {useAppRouter} from '@/components/app-router-provider';
import {Button} from '@/components/ui/button';
import {X} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {useTranslations} from 'use-intl';
import {useNavigate, useLocation} from 'react-router';

type LogoutDialogState = {logoutDialog?: true} | null;

export interface LogoutDialogController {
    open: boolean;
    setOpen: (open: boolean) => Promise<void>;
}

export function useLogoutDialogController(): LogoutDialogController {
    const router = useAppRouter();
    const location = useLocation();
    const navigate = useNavigate();

    const open = !!(location.state as LogoutDialogState)?.logoutDialog;

    function setOpen(value: boolean) {
        const location = router.location();
        if (value) {
            return navigate(location, {
                state: {
                    ...(location.state as object),
                    logoutDialog: true,
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

interface LogoutDialogProps {
    suggestBindEmail: boolean;
    onLogout: () => void;
    onBindEmail?: () => void;
}

export function LogoutDialog({
    suggestBindEmail,
    onLogout,
    onBindEmail,
}: LogoutDialogProps) {
    const t = useTranslations('log_out_dialog');
    const controller = useLogoutDialogController();

    return (
        <StyledDialogWrapper
            open={controller.open}
            onOpenChange={value => void controller.setOpen(value)}
        >
            <div>
                <div className="flex justify-end pt-2 pr-2">
                    <Dialog.Close asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Dialog.Close>
                </div>
                <div className="px-4 pb-4">
                    <Dialog.Title className="text-center font-normal">
                        {suggestBindEmail ? t('title_no_email') : t('title')}
                    </Dialog.Title>
                    <div className="w-full flex flex-row grow-1 gap-2 mt-4">
                        {suggestBindEmail && (
                            <>
                                <Button
                                    className="cursor-pointer"
                                    variant="ghost"
                                    onClick={onLogout}
                                >
                                    {t('anyway')}
                                </Button>
                                <div className="flex-1" />
                                <Button
                                    className="cursor-pointer"
                                    onClick={() => {
                                        if (onBindEmail !== undefined) {
                                            onBindEmail();
                                        }
                                    }}
                                >
                                    {t('bind_email')}
                                </Button>
                            </>
                        )}
                        {!suggestBindEmail && (
                            <>
                                <Button
                                    className="cursor-pointer"
                                    variant="ghost"
                                    onClick={() =>
                                        void controller.setOpen(false)
                                    }
                                >
                                    {t('cancel')}
                                </Button>
                                <div className="flex-1" />
                                <Button
                                    className="cursor-pointer"
                                    onClick={onLogout}
                                >
                                    {t('yes')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </StyledDialogWrapper>
    );
}
