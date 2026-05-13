'use client';

import {useTranslations} from 'next-intl';
import {useQueryClient} from '@tanstack/react-query';
import {Copy, Loader2, QrCodeIcon, RotateCcw} from 'lucide-react';
import QRCode from 'react-qr-code';
import {Button} from '@/components/ui/button';
import {toast} from 'sonner';

export function QrCodeCard({url}: {url: string | null}) {
    const t = useTranslations('profile');
    const queryClient = useQueryClient();

    return (
        <div className="md:w-1/4 md:h-fit md:mt-4 md:mr-8 flex flex-col items-center md:items-start p-4 md:rounded-xl md:border md:border-zinc-200 dark:md:border-zinc-800 md:bg-white dark:md:bg-zinc-900 text-sm">
            <div className="flex flex-col gap-2 pl-2 pt-2 pr-2">
                <div className="flex flex-row gap-2 items-center font-medium text-zinc-900 dark:text-zinc-100">
                    <QrCodeIcon className="w-4 h-4" /> {t('qr.title')}
                </div>
                <p className="text-neutral-700 dark:text-zinc-400">
                    {t('qr.desc')}
                </p>
            </div>
            <div className="h-6 md:h-2" />
            <div className="w-full flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl border border-zinc-200">
                    {url ? (
                        <QRCode value={url} className="w-32 h-32" />
                    ) : (
                        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
                    )}
                </div>
                <div className="h-2" />
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 dark:bg-zinc-950 dark:hover:bg-zinc-800 cursor-pointer"
                        onClick={() => {
                            void navigator.clipboard.writeText(url ?? '');
                            toast.success(t('qr.copied'));
                        }}
                    >
                        <Copy className="w-4 h-4 mr-2" /> {t('qr.copy')}
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 dark:bg-zinc-950 dark:hover:bg-zinc-800 cursor-pointer"
                        onClick={() => {
                            void queryClient.invalidateQueries({
                                queryKey: ['inviteToken'],
                            });
                        }}
                    >
                        <RotateCcw className="s-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
