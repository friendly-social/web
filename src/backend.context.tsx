import {createContext, useContext} from 'react';
import * as authService from '@/services/auth-service';
import {BackendService} from '@/services/backend-service';
import {FriendlyClient, FriendlyClientImpl} from '@/network/friendly-client';
import {useAppContext, AppContext} from '@/app.context';

const BackendContext = createContext<BackendService | null>(null);

export function initializeBackendService(app: AppContext) {
    const client: FriendlyClient = new FriendlyClientImpl();
    const service = new BackendService(client);
    const authorization = authService.get(app);
    if (authorization) {
        service.setAuthorization(authorization);
    }
    app.backend = service;
}

export function BackendProvider({children}: {children: React.ReactNode}) {
    const app = useAppContext();

    return (
        <BackendContext.Provider value={app.backend}>
            {children}
        </BackendContext.Provider>
    );
}

export function useBackend() {
    const ctx = useContext(BackendContext);
    if (!ctx) throw new Error('useBackend must be used inside BackendProvider');
    return ctx;
}
