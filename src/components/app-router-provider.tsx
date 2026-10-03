import {ReactNode, createContext, useContext} from 'react';
import {DataRouter, Location} from 'react-router';

const Context = createContext<DataRouter | null>(null);

export interface AppRouterProviderProps {
    value: DataRouter;
    children: ReactNode;
}

export interface AppRouter {
    location: () => Location;
}

export function useAppRouter(): AppRouter {
    const dataRouter = useContext(Context);
    if (!dataRouter) {
        throw new Error('Use AppRouterProvider first');
    }
    function location() {
        // USE OF PRIVATE HERE.
        //
        // For some reason API designers decided that getting live location is
        // not a valid usecase. I don't think so, it helps to isolate
        // state-changing components.
        //
        // If that gets removed tomorrow, I will easily create a wrapper that
        // stores it via my proxies to useNavigate and useLocation
        return dataRouter!.state.location;
    }
    return {location};
}

export function AppRouterProvider({value, children}: AppRouterProviderProps) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
}
