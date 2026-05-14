'use client';

import {createContext, useContext} from 'react';
import {BackendService} from '@/services/backend-service';
import {getBackend} from '@/lib/backend';

const BackendContext = createContext<BackendService | null>(null);

export function BackendProvider({children}: {children: React.ReactNode}) {
    const backend = getBackend();

    return (
        <BackendContext.Provider value={backend}>
            {children}
        </BackendContext.Provider>
    );
}

export function useBackend() {
    const ctx = useContext(BackendContext);
    if (!ctx) throw new Error('useBackend must be used inside BackendProvider');
    return ctx;
}
