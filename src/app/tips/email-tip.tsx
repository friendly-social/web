import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {useAppRouter} from '@/components/app-router-provider';
import {useNavigate, useLocation} from 'react-router';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {users} from '@/services/users-service';
import {X} from 'lucide-react';
import {Dialog} from 'radix-ui';
import {useTranslations} from 'use-intl';
import {AppContext} from '@/app.context';
import * as idb from 'idb-keyval';

const COUNTER = 'email-tip-counter';

export interface ShouldShowProps {
    app: AppContext;
    visits: number;
    firstVisit: number;
}

export async function shouldShow({
    app,
    visits,
    firstVisit,
}: ShouldShowProps): Promise<Payload | undefined> {
    const self = await users.ensureCachedSelf(app);
    if (self.user.email) return;

    const counter: number = (await idb.get(COUNTER)) ?? 0;
    const now = Date.now();

    if (counter === 0) {
        return {firstTime: true};
    }
    if (counter === 1) {
        return visits > 3 ? {firstTime: false} : undefined;
    }
    if (counter === 2) {
        return now - firstVisit > 1_000 * 60 * 60 * 24 * 7 // 1 week
            ? {firstTime: false}
            : undefined;
    }
    if (counter === 3) {
        return now - firstVisit > 1_000 * 60 * 60 * 24 * 30 // 1 month
            ? {firstTime: false}
            : undefined;
    }
    const year = 1_000 * 60 * 60 * 24 * 360; // 1 year
    return now - firstVisit > year * (counter - 2)
        ? {firstTime: false}
        : undefined;
}

export async function recordShow() {
    const counter: number = (await idb.get(COUNTER)) ?? 0;
    await idb.set(COUNTER, counter + 1);
}

export function Content() {
    const t = useTranslations('email-tip');
    const navigate = useNavigate();
    const {payload, setPayload} = useController();

    function decline() {
        void setPayload(undefined);
    }

    function confirm() {
        void setPayload(undefined).then(() =>
            navigate('/profile', {
                state: {edit: true},
            }),
        );
    }

    return (
        <>
            <StyledDialogWrapper
                open={!!payload}
                onOpenChange={() => void setPayload(undefined)}
            >
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
                        {t(
                            payload?.firstTime
                                ? 'description-first-time'
                                : 'description',
                        )}
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

type State = {emailTip?: Payload} | null;

export interface Payload {
    firstTime: boolean;
}

export interface Controller {
    payload?: Payload;
    setPayload: (payload?: Payload) => Promise<void>;
}

export function useController(): Controller {
    const router = useAppRouter();
    const location = useLocation();
    const navigate = useNavigate();

    const payload = (location.state as State)?.emailTip;

    function setPayload(payload?: Payload) {
        const location = router.location();
        if (payload) {
            return navigate(location, {
                state: {
                    ...(location.state as object),
                    emailTip: payload,
                },
            }) as Promise<void>;
        } else {
            return navigate(-1) as Promise<void>;
        }
    }

    return {
        payload,
        setPayload,
    };
}
