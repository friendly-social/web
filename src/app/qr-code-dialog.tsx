import {useAppRouter} from '@/components/app-router-provider';
import {useNavigate, useLocation} from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import {useBackend} from '@/backend.context';
import {Button} from '@/components/ui/button';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {createFriendInviteLink} from '@/lib/utils';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Copy, Loader2, X} from 'lucide-react';
import QRCode from 'react-qr-code';
import {toast} from 'sonner';
import {useTranslations} from 'use-intl';
import {useEffect, useState} from 'react';
import {forceUnwrap} from '@/network/result';

type QrCodeDialogState = {qrCodeDialog?: true} | null;

export interface QrCodeDialogController {
    open: boolean;
    setOpen: (open: boolean) => Promise<void>;
}

export function useQrCodeDialogController(): QrCodeDialogController {
    const router = useAppRouter();
    const location = useLocation();
    const navigate = useNavigate();

    const open = !!(location.state as QrCodeDialogState)?.qrCodeDialog;

    function setOpen(value: boolean) {
        const location = router.location();
        if (value) {
            return navigate(location, {
                state: {
                    ...(location.state as object),
                    qrCodeDialog: true,
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

export function QrCodeDialog() {
    const {open, setOpen} = useQrCodeDialogController();

    return (
        <StyledDialogWrapper
            open={open}
            onOpenChange={value => void setOpen(value)}
        >
            <QrCodeDialogContent setOpen={value => void setOpen(value)} />
        </StyledDialogWrapper>
    );
}

interface QrCodeDialogContentProps {
    setOpen: (value: boolean) => void;
}

function QrCodeDialogContent({setOpen}: QrCodeDialogContentProps) {
    const t = useTranslations('profile');
    const backend = useBackend();
    const queryClient = useQueryClient();

    const [expiration, setExpiration] = useState<string | null>(null);

    const inviteQuery = useQuery({
        queryKey: ['inviteToken'],
        queryFn: async () => {
            return forceUnwrap(await backend.generateFriendInvitationToken());
        },
    });

    const forceRefreshMutation = useMutation({
        mutationFn: async () => {
            return forceUnwrap(await backend.friendsGenerateForce());
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({queryKey: ['inviteToken']});
        },
    });

    function forceRefresh() {
        if (forceRefreshMutation.isPending) return;
        forceRefreshMutation.mutate();
    }

    useEffect(() => {
        const expiration = inviteQuery.data?.expiration;
        if (!expiration) {
            setExpiration(null);
            return;
        }
        const nudge = () => {
            const duration = Date.parse(expiration) - Date.now();
            if (duration < 0) {
                setExpiration(null);
                return;
            }
            const seconds = String(Math.floor((duration / 1_000) % 60));
            const minutes = String(Math.floor((duration / 1_000 / 60) % 60));
            const hours = Math.floor(duration / 1_000 / 60 / 60);
            const display =
                `${hours}:` +
                minutes.padStart(2, '0') +
                ':' +
                seconds.padStart(2, '0');
            setExpiration(display);
        };
        nudge();
        const intervalId = window.setInterval(() => nudge(), 500);
        return () => window.clearInterval(intervalId);
    }, [inviteQuery.data?.expiration]);

    const url =
        inviteQuery.data &&
        !inviteQuery.isPending &&
        !forceRefreshMutation.isPending
            ? createFriendInviteLink(inviteQuery.data.token)
            : null;

    const revoke = (
        <span
            className="underline cursor-pointer"
            onClick={() => forceRefresh()}
        >
            {t('qr.revoke')}
        </span>
    );

    return (
        <>
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
                    {url && expiration ? (
                        <QRCode value={url} className="w-full aspect-square" />
                    ) : (
                        <div className="w-full aspect-square flex items-center justify-center">
                            <Loader2 className="size-10 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="w-full flex flex-col items-center gap-1">
                    {url && expiration && (
                        <span className="text-sm text-muted-foreground">
                            {t('qr.expiration')} {expiration} ({revoke})
                        </span>
                    )}
                    <Button
                        variant="default"
                        className="flex-1 cursor-pointer max-w-sm w-full"
                        onClick={() => {
                            void setOpen(false);
                            void navigator.clipboard.writeText(url ?? '');
                            toast.success(t('qr.copied'));
                        }}
                    >
                        <Copy className="size-4" />
                        {t('qr.copy')}
                    </Button>
                </div>
            </div>
        </>
    );
}
