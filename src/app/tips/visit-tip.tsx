import {ReactNode} from 'react';
import {useAppContext} from '@/app.context';
import {useEffect} from 'react';
import * as idb from 'idb-keyval';
import * as emailTip from '@/app/tips/email-tip';
import * as notificationsTip from '@/app/tips/notifications-tip';

const VISITS = 'tip-visits';
const VISIT_RECORDED = 'tip-recorded';
const FIRST_VISIT = 'tip-first-visit';

export interface VisitTipProps {
    children: ReactNode;
}

export function VisitTip({children}: VisitTipProps) {
    const app = useAppContext();
    const emailTipController = emailTip.useController();
    const notificationsTipController = notificationsTip.useController();

    useEffect(() => {
        void (async () => {
            let visits: number = (await idb.get(VISITS)) ?? 0;
            const visitRecorded = sessionStorage.getItem(VISIT_RECORDED);
            if (visitRecorded) {
                return;
            }
            sessionStorage.setItem(VISIT_RECORDED, 'true');
            visits++;
            await idb.set(VISITS, visits);

            let firstVisit: number | undefined = await idb.get(FIRST_VISIT);
            if (!firstVisit) {
                firstVisit = Date.now();
                await idb.set(FIRST_VISIT, firstVisit);
            }

            const [showEmail, showNotifications] = await Promise.all([
                emailTip.shouldShow({app, visits, firstVisit}),
                notificationsTip.shouldShow({visits, firstVisit}),
            ]);
            if (showEmail) {
                await emailTip.recordShow();
                await emailTipController.setOpen(true);
                return;
            }
            if (showNotifications) {
                await notificationsTip.recordShow();
                await notificationsTipController.setOpen(true);
                return;
            }
        })();
    }, []);

    return (
        <>
            {children}
            <emailTip.Content />
            <notificationsTip.Content />
        </>
    );
}
