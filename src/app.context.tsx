import {FriendlyStorage} from '@/services/friendly-storage';
import {QueryClient} from '@tanstack/react-query';
import {BackendService} from '@/services/backend-service';
import * as authService from '@/services/auth-service';
import {
    ReactNode,
    useEffect,
    createContext,
    useContext,
    RefObject,
    useRef,
} from 'react';

const AppContextDescriptor = createContext<AppContext | null>(null);

/**
 * React prop-drilling made type-safe. Injected once, for the whole app, used
 * everywhere.
 */
export interface AppContext {
    backend: BackendService;
    authServiceContext: authService.Context;
    queryClient: QueryClient;
    storage: FriendlyStorage;
}

export function useAppContextRef(): RefObject<AppContext> {
    const appContext = useAppContext();
    const ref = useRef<AppContext>(appContext);
    useEffect(() => {
        ref.current = appContext;
    }, [appContext]);
    return ref;
}

export function useAppContext() {
    const appContext = useContext(AppContextDescriptor);
    if (!appContext) {
        throw new Error(
            'AppContext should be only used inside AppContextProvider',
        );
    }
    return appContext;
}

export interface AppContextProviderProps {
    preset: AppContext;
    children: ReactNode;
}

export function AppContextProvider({
    preset: app,
    children,
}: AppContextProviderProps): ReactNode {
    return (
        <AppContextDescriptor.Provider value={app}>
            {children}
        </AppContextDescriptor.Provider>
    );
}
