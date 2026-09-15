import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {useAppContext} from '@/app.context';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {X} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {useTranslations} from 'use-intl';
import * as idb from 'idb-keyval';
import * as notifications from '@/notifications';
import {isSupported} from 'firebase/messaging';

const COUNTER = 'notifications-tip-counter';
const DISABLE = 'notifications-tip-disable';

export interface ShouldShowProps {
    visits: number;
    firstVisit: number;
}

export async function shouldShow({
    visits,
    firstVisit,
}: ShouldShowProps): Promise<boolean> {
    if (!(await isSupported())) {
        return false;
    }
    const counter: number = (await idb.get(COUNTER)) ?? 0;

    const disable: boolean = (await idb.get(DISABLE)) ?? false;
    if (disable) {
        return false;
    }

    const now = Date.now();
    if (visits < 3) {
        return false;
    }
    if (counter === 0) {
        return true;
    }
    if (counter === 1) {
        return now - firstVisit > 1_000 * 60 * 60 * 24 * 7; // 1 week
    }
    if (counter === 2) {
        return now - firstVisit > 1_000 * 60 * 60 * 24 * 30; // 1 month
    }
    const year = 1_000 * 60 * 60 * 24 * 360; // 1 year
    return now - firstVisit > year * (counter - 2);
}

export async function recordShow() {
    const counter: number = (await idb.get(COUNTER)) ?? 0;
    await idb.set(COUNTER, counter + 1);
}

export interface ContentProps {
    show: boolean;
    setShow: (value: boolean) => void;
}

export function Content({show, setShow}: ContentProps) {
    const app = useAppContext();
    const t = useTranslations('notifications-tip');

    function decline() {
        setShow(false);
    }

    function confirm() {
        setShow(false);
        void idb.set(DISABLE, true);
        void notifications.request(app);
    }

    return (
        <>
            <StyledDialogWrapper open={show} onOpenChange={setShow}>
                <div
                    className={cn(
                        'flex',
                        'm-2 pt-1 px-8 relative',
                        'justify-center',
                    )}
                >
                    <Dialog.Title className="text-center font-semibold h-fit">
                        {t('title')}
                    </Dialog.Title>
                    <Dialog.Close asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer absolute top-0 right-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </Dialog.Close>
                </div>
                <div className="px-4 pb-4">
                    <Dialog.Description className="text-center font-normal">
                        {t('description')}
                    </Dialog.Description>
                    <div className="w-full flex flex-row grow-1 mt-2">
                        <Button
                            className="cursor-pointer"
                            variant="ghost"
                            onClick={decline}
                        >
                            {t('decline')}
                        </Button>
                        <div className="flex-1" />
                        <Button className="cursor-pointer" onClick={confirm}>
                            {t('confirm')}
                        </Button>
                    </div>
                </div>
            </StyledDialogWrapper>
        </>
    );
}
