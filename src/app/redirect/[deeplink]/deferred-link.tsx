import {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
} from 'react';

const DeferredLinkContext = createContext<DeferredLinkState | undefined>(
    undefined,
);

export interface DeferredLink {
    type: 'add-friend';
    token: string;
}

export interface DeferredLinkState {
    link: DeferredLink | undefined;
    setLink: Dispatch<SetStateAction<DeferredLink | undefined>>;
}

export function useDeferredLink(): [
    DeferredLinkState['link'],
    DeferredLinkState['setLink'],
] {
    const context = useContext(DeferredLinkContext);
    if (!context) {
        throw new Error("Can't use deferred link outside of provider");
    }
    return [context.link, context.setLink];
}

export interface DeeplinkProviderProps {
    children: ReactNode;
}

export function DeferredLinkProvider({children}: DeeplinkProviderProps) {
    const [link, setLink] = useState<DeferredLink | undefined>();
    const state: DeferredLinkState = {link, setLink};

    return (
        <DeferredLinkContext.Provider value={state}>
            {children}
        </DeferredLinkContext.Provider>
    );
}
