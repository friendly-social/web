import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import * as authService from '@/services/auth-service';
import {useAppContext} from '@/app.context';

export type SessionStatus = 'loading' | 'authed' | 'guest';

interface SessionContextValue {
    status: SessionStatus;
    isAuthed: boolean;
    refresh: () => void;
    setAuthed: () => void;
    logOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({children}: {children: React.ReactNode}) {
    const app = useAppContext();
    const [status, setStatus] = useState<SessionStatus>(() =>
        authService.get(app) ? 'authed' : 'guest',
    );

    const refresh = useCallback(() => {
        const ok = authService.get(app);
        setStatus(ok ? 'authed' : 'guest');
    }, [app]);

    const setAuthed = useCallback(() => setStatus('authed'), []);

    const logOut = useCallback(() => {
        localStorage.clear();
        app.backend.clearAuthorization();
        authService.clear(app);
        setStatus('guest');
    }, [app]);

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
