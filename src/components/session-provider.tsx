import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
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
    const [status, setStatus] = useState<SessionStatus>('loading');

    const refresh = useCallback(() => {
        const ok = backend.restoreAuthorizationIfPossible();
        setStatus(ok ? 'authed' : 'guest');
    }, [backend]);

    const setAuthed = useCallback(() => setStatus('authed'), []);

    const logOut = useCallback(() => {
        localStorage.clear();
        backend.clearAuthorization();
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
