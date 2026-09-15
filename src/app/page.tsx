import {useLayoutEffect, useEffect, useState} from 'react';
import {SessionStatus} from '@/components/session-provider';
import {useNavigate, useLocation} from 'react-router';
import {Outlet} from 'react-router';
import {useSession} from '@/components/session-provider';
import {useBlockingQR} from '@/app/blocking-qr/page';
import {users} from '@/services/users-service';
import {useAppContext} from '@/app.context';
import {Loader2} from 'lucide-react';

export function AppPage() {
    const [loading, setLoading] = useState(true);
    const [loadingLong, setLoadingLong] = useState(false);

    const navigate = useNavigate();
    const session = useSession();
    const location = useLocation();
    const app = useAppContext();

    useEffect(() => {
        if (location.pathname === '/') {
            void navigate('/community');
        }
        void users.prefetchSelf(app);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => setLoadingLong(true), 500);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (session.status === 'loading') return;
        setLoading(false);
    }, [session.status]);

    if (loading && loadingLong) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <Outlet />;
}

export function AuthorizedGuard() {
    const navigate = useNavigate();
    const session = useSession();
    const blockingQR = useBlockingQR();
    const [initialStatus, setInitialStatus] = useState<SessionStatus>();

    useLayoutEffect(() => {
        if (session.status === 'loading') return;
        if (initialStatus !== undefined) return;
        setInitialStatus(session.status);
        if (session.status === 'guest') {
            void navigate('/sign-up');
        } else if (blockingQR.shouldBlock) {
            void navigate('/blocking-qr');
        }
    }, [navigate, session.status, initialStatus, blockingQR.shouldBlock]);

    if (initialStatus === 'authed') {
        return <Outlet />;
    }

    return null;
}

export function UnauthorizedGuard() {
    const navigate = useNavigate();
    const session = useSession();
    const [initialStatus, setInitialStatus] = useState<SessionStatus>();

    useLayoutEffect(() => {
        if (session.status === 'loading') return;
        if (initialStatus !== undefined) return;
        setInitialStatus(session.status);
        if (session.status === 'authed') {
            void navigate('/');
        }
    }, [session.status, navigate, initialStatus]);

    if (initialStatus === 'guest') {
        return <Outlet />;
    }

    return null;
}
