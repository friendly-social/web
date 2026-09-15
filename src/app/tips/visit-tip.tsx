import {ReactNode} from 'react';
import {useAppContext} from '@/app.context';
import {useState, useEffect} from 'react';
import * as idb from 'idb-keyval';
import * as emailTip from '@/app/tips/email-tip';
import * as notificationsTip from '@/app/tips/notifications-tip';

const VISITS = 'tip-visits';
const FIRST_VISIT = 'tip-first-visit';

export interface VisitTipProps {
    children: ReactNode;
}

export function VisitTip({children}: VisitTipProps) {
    const app = useAppContext();
    const [showEmail, setShowEmail] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        let cancel = false;
        void (async () => {
            let visits: number = (await idb.get(VISITS)) ?? 0;
            visits++;
            if (cancel) return;
            await idb.set(VISITS, visits);

            let firstVisit: number | undefined = await idb.get(FIRST_VISIT);
            if (!firstVisit) {
                firstVisit = Date.now();
                await idb.set(FIRST_VISIT, firstVisit);
            }
            if (cancel) return;

            const [showEmail, showNotifications] = await Promise.all([
                emailTip.shouldShow({app, visits, firstVisit}),
                notificationsTip.shouldShow({visits, firstVisit}),
            ]);
            if (cancel) return;
            if (showEmail) {
                await emailTip.recordShow();
                setShowEmail(true);
                return;
            }
            if (showNotifications) {
                await notificationsTip.recordShow();
                setShowNotifications(true);
                return;
            }
        })();
        return () => {
            cancel = true;
        };
    }, []);

    return (
        <>
            {children}
            <emailTip.Content show={showEmail} setShow={setShowEmail} />
            <notificationsTip.Content
                show={showNotifications}
                setShow={setShowNotifications}
            />
        </>
    );
}
