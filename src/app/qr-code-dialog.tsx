import {useAppContext} from '@/app.context';
import * as Dialog from '@radix-ui/react-dialog';
import {useBackend} from '@/backend.context';
import {Button} from '@/components/ui/button';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {createFriendInviteLink} from '@/lib/utils';
import {useQuery} from '@tanstack/react-query';
import {Copy, Loader2, X} from 'lucide-react';
import QRCode from 'react-qr-code';
import {toast} from 'sonner';
import {useTranslations} from 'use-intl';
import {users} from '@/services/users-service';

export interface QrCodeDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function QrCodeDialog({open, setOpen}: QrCodeDialogProps) {
    const t = useTranslations('profile');
    const backend = useBackend();
    const app = useAppContext();
    const user = users.useSelf(app).data!.user;

    const inviteQuery = useQuery({
        queryKey: ['inviteToken'],
        queryFn: () => backend.generateFriendInvitationToken(),
        enabled: open,
    });

    const url =
        user?.id && inviteQuery.data?.ok
            ? createFriendInviteLink(user.id, inviteQuery.data.data)
            : null;

    return (
        <StyledDialogWrapper open={open} onOpenChange={setOpen}>
            <div className="relative flex items-center mt-1 mx-1">
                <Dialog.Title className="w-full text-base font-semibold text-center pt-2">
                    {t('qr.title')}
                </Dialog.Title>

                <Dialog.Close className="absolute right-0 top-0" asChild>
                    <Button variant="ghost" className="cursor-pointer">
                        <X />
                    </Button>
                </Dialog.Close>
            </div>
            <div className="flex flex-col items-center gap-4 px-4 pb-4">
                <Dialog.Description>{t('qr.desc')}</Dialog.Description>
                <div className="bg-white p-5 rounded-2xl border border-border w-full max-w-72">
                    {url ? (
                        <QRCode value={url} className="w-full aspect-square" />
                    ) : (
                        <div className="w-full aspect-square flex items-center justify-center">
                            <Loader2 className="size-10 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="flex gap-3 w-full">
                    <Button
                        variant="default"
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                            setOpen(false);
                            void navigator.clipboard.writeText(url ?? '');
                            toast.success(t('qr.copied'));
                        }}
                    >
                        <Copy className="size-4" />
                        {t('qr.copy')}
                    </Button>
                </div>
            </div>
        </StyledDialogWrapper>
    );
}
