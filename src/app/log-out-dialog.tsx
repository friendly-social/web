import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {Button} from '@/components/ui/button';
import {X} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {useTranslations} from 'use-intl';

interface LogoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suggestBindEmail: boolean;
    onLogout: () => void;
    onBindEmail?: () => void;
}

export function LogoutDialog({
    open,
    onOpenChange,
    suggestBindEmail,
    onLogout,
    onBindEmail,
}: LogoutDialogProps) {
    const t = useTranslations('log_out_dialog');
    return (
        <StyledDialogWrapper open={open} onOpenChange={onOpenChange}>
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
                                    onClick={() => onOpenChange(false)}
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
