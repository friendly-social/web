import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {Button} from '@/components/ui/button';
import {X} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {useTranslations} from 'use-intl';

interface LogoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hasEmail: boolean;
    onLogout: () => void;
    onBindEmail: () => void;
}

export function LogoutDialog({
    open,
    onOpenChange,
    hasEmail,
    onLogout,
    onBindEmail,
}: LogoutDialogProps) {
    const t = useTranslations('log_out_dialog');
    return (
        <StyledDialogWrapper
            open={open}
            onOpenChange={onOpenChange}
            contentClassName="-translate-y-1/2 w-fit max-w-sm max-h-none rounded-2xl bg-white dark:bg-zinc-950 shadow-lg"
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
                <div className="px-6 pb-6">
                    <h2 className="text-center">
                        {hasEmail ? t('title') : t('title_no_email')}
                    </h2>
                    <div className="w-full flex flex-row grow-1 gap-2 mt-4">
                        {!hasEmail && (
                            <Button
                                className="grow-1 cursor-pointer"
                                onClick={() => {
                                    onBindEmail();
                                }}
                            >
                                {t('bind_email')}
                            </Button>
                        )}
                        <Button
                            className="grow-1 cursor-pointer"
                            variant="destructive"
                            onClick={onLogout}
                        >
                            {t('yes')}
                        </Button>
                    </div>
                </div>
            </div>
        </StyledDialogWrapper>
    );
}
