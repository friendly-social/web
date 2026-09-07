import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {authService} from '@/services/auth-service';
import {useAppContext} from '@/app.context';
import {useBackend} from '@/backend.context';

type SessionStatus = 'loading' | 'authed' | 'guest';

interface SessionContextValue {
    status: SessionStatus;
    isAuthed: boolean;
    refresh: () => void;
    setAuthed: () => void;
    logOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({children}: {children: React.ReactNode}) {
    const backend = useBackend();
    const app = useAppContext();
    const [status, setStatus] = useState<SessionStatus>('loading');

    const refresh = useCallback(() => {
        // TODO(demo): временно — ?demo=1 в dev-режиме показывает приложение
        // с меню, даже без авторизации на бэкенде
        const demo =
            import.meta.env.DEV &&
            new URLSearchParams(window.location.search).has('demo');
        const ok = demo || authService.get(app);
        setStatus(ok ? 'authed' : 'guest');
    }, [app, backend]);

    const setAuthed = useCallback(() => setStatus('authed'), []);

    const logOut = useCallback(() => {
        localStorage.clear();
        backend.clearAuthorization();
        authService.clear(app);
        setStatus('guest');
    }, [backend]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo(
        () => ({
            status,
            isAuthed: status === 'authed',
            refresh,
            setAuthed,
            logOut,
        }),
        [status, refresh, setAuthed, logOut],
    );

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) {
        throw new Error('useSession must be used inside SessionProvider');
    }
    return ctx;
}
