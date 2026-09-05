import {useLocation, useNavigationType, NavigationType} from 'react-router';
import {ReactNode, RefObject, useRef, useLayoutEffect, useEffect} from 'react';
import {cn} from '@/lib/utils';
import {TopBar} from '@/app/top-bar';
import {MenuRail, MenuBar} from '@/app/menu';
import {useSession} from '@/components/session-provider';
import {useBlockingQR} from '@/app/blocking-qr/page';
import {createContext, useContext} from 'react';
import {TopBarContext, useTopBarContext} from '@/app/top-bar';

const ScaffoldContextKey = createContext<ScaffoldContext | null>(null);

export interface ScaffoldContext {
    topBar: TopBarContext;
}

export function useScaffoldContext(): ScaffoldContext {
    const value = useContext(ScaffoldContextKey);
    if (!value) throw new Error('ScaffoldContext must be used inside Scaffold');
    return value;
}

export interface ScaffoldProps {
    children: ReactNode;
}

export function Scaffold({children}: ScaffoldProps): ReactNode {
    const session = useSession();
    const blockingQR = useBlockingQR();
    const showMenu = session.isAuthed && !blockingQR.shouldBlock;

    const topBar = useTopBarContext();

    const context = {
        topBar,
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex flex-col h-dvh w-dvw bg-background">
            <TopBar {...topBar} />
            <div className="flex-1 h-full flex min-h-0">
                {showMenu && (
                    <>
                        <div
                            className={cn(
                                'h-full',
                                'bg-card',
                                'hidden md:block',
                            )}
                        >
                            <MenuRail />
                        </div>
                        <div
                            className={cn(
                                'h-full w-px hidden md:block',
                                'bg-border',
                            )}
                        />
                    </>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                    <div ref={scrollRef} className="overflow-y-auto flex-1">
                        <ScrollRestoration scrollRef={scrollRef} />
                        <ScaffoldContextKey.Provider value={context}>
                            {children}
                        </ScaffoldContextKey.Provider>
                    </div>
                    {showMenu && (
                        <>
                            <div
                                className={cn(
                                    'w-full h-px md:hidden',
                                    'bg-border',
                                )}
                            />
                            <div
                                className={cn('w-full', 'bg-card', 'md:hidden')}
                            >
                                <MenuBar />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ScrollRestorationProps {
    scrollRef: RefObject<HTMLDivElement | null>;
}

function ScrollRestoration({scrollRef}: ScrollRestorationProps) {
    const location = useLocation();
    const navigationType = useNavigationType();

    useLayoutEffect(() => {
        const scroll = scrollRef.current;
        if (!scroll) return;
        if (
            navigationType === NavigationType.Push ||
            navigationType === NavigationType.Replace
        ) {
            scroll.scrollTo(0, 0);
        } else {
            const saved = sessionStorage.getItem(`scroll:${location.key}`);
            scroll.scrollTo(0, saved ? Number(saved) : 0);
        }
    }, [location.key, navigationType]);

    useEffect(() => {
        const scroll = scrollRef.current;
        if (!scroll) return;
        const save = () => {
            sessionStorage.setItem(
                `scroll:${location.key}`,
                scroll.scrollTop.toString(),
            );
        };
        scroll.addEventListener('scroll', save);
        return () => {
            scroll.removeEventListener('scroll', save);
        };
    }, [location.key]);

    return null;
}
