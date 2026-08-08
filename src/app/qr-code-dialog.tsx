import {useAppContext} from '@/app.context';
import {useBackend} from '@/backend.context';
import {Button} from '@/components/ui/button';
import {BaseDialog} from '@/components/base-dialog';
import {createFriendInviteLink} from '@/lib/utils';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {Copy, Loader2, RotateCcw} from 'lucide-react';
import QRCode from 'react-qr-code';
import {toast} from 'sonner';
import {useTranslations} from 'use-intl';
import {unwrap} from '@/network/result';
import {NetworkError} from '@/network/errors';

export interface QrCodeDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function QrCodeDialog({open, setOpen}: QrCodeDialogProps) {
    const t = useTranslations('profile');
    const queryClient = useQueryClient();
    const backend = useBackend();
    const user = useAppContext().userDetails;

    const inviteQuery = useQuery<string, NetworkError>({
        queryKey: ['inviteToken'],
        queryFn: () => backend.generateFriendInvitationToken().then(unwrap),
        enabled: open,
    });

    const url =
        user?.id && inviteQuery.data
            ? createFriendInviteLink(user.id, inviteQuery.data)
            : null;

    async function forceRefresh() {
        await backend.friendsGenerateForce();
        void queryClient.invalidateQueries({
            queryKey: ['inviteToken'],
        });
    }

    return (
        <BaseDialog
            isShow={open}
            onOpenChange={setOpen}
            title={t('qr.title')}
            subtitle={t('qr.desc')}
        >
            <div className="flex flex-col items-center gap-4">
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
                        variant="secondary"
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                            void navigator.clipboard.writeText(url ?? '');
                            toast.success(t('qr.copied'));
                        }}
                    >
                        <Copy className="size-4" />
                        {t('qr.copy')}
                    </Button>
                    <Button
                        variant="outline"
                        className="cursor-pointer px-4"
                        onClick={() => void forceRefresh()}
                        aria-label={t('qr.regenerate')}
                        title={t('qr.regenerate')}
                    >
                        <RotateCcw className="size-4" />
                    </Button>
                </div>
            </div>
        </BaseDialog>
    );
}
