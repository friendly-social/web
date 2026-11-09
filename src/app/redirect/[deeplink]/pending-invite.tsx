import {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
} from 'react';

const PendingInviteContext = createContext<PendingInviteState | undefined>(
    undefined,
);

export interface PendingInvite {
    token: string;
}

export interface PendingInviteState {
    link: PendingInvite | undefined;
    setLink: Dispatch<SetStateAction<PendingInvite | undefined>>;
}

export function usePendingInvite(): [
    PendingInviteState['link'],
    PendingInviteState['setLink'],
] {
    const context = useContext(PendingInviteContext);
    if (!context) {
        throw new Error("Can't use pending invite outside of provider");
    }
    return [context.link, context.setLink];
}

export interface DeeplinkProviderProps {
    children: ReactNode;
}

export function PendingInviteProvider({children}: DeeplinkProviderProps) {
    const [link, setLink] = useState<PendingInvite | undefined>();
    const state: PendingInviteState = {link, setLink};

    return (
        <PendingInviteContext.Provider value={state}>
            {children}
        </PendingInviteContext.Provider>
    );
}
