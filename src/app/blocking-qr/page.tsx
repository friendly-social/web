import * as Dialog from '@radix-ui/react-dialog';
import {useNavigate} from 'react-router';
import {
    useEffect,
    useState,
    ReactNode,
    createContext,
    useContext,
    useMemo,
} from 'react';
import {toast} from 'sonner';
import {Link, HatGlasses} from 'lucide-react';
import {useBackend} from '@/backend.context';
import {Spinner} from '@/components/ui/spinner';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {Field, FieldError, FieldLabel} from '@/components/ui/field';
import {useTranslations} from 'use-intl';
import {Button} from '@/components/ui/button';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {useSession} from '@/components/session-provider';
import {LogoutDialog} from '../log-out-dialog';

export function BlockingQR(): ReactNode {
    const controller = useBlockingQR();

    const t = useTranslations('blocking-qr');
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState('');
    const [linkError, setLinkError] = useState<string | null>();
    const [openLogout, setOpenLogout] = useState(false);
    const backend = useBackend();
    const session = useSession();
    const navigate = useNavigate();

    useEffect(() => {
        if (!controller.shouldBlock) {
            void navigate('/');
        }
    }, [controller.shouldBlock]);

    async function onJoin() {
        setLinkError(null);
        setLoading(true);
        try {
            const parseLinkResult = parseLink({raw: link});
            if (!parseLinkResult.ok) {
                setLinkError(t('link-invalid'));
                return;
            }
            const {userId, token} = parseLinkResult.data;
            const result = await backend.addFriend({userId, token});
            if (!result.ok) {
                if (result.error.type === 'status') {
                    toast.error(t('link-expired'));
                } else {
                    toast.error(t('error-connection'));
                }
                return;
            }
            if (result.data.type === 'FriendTokenExpired') {
                toast.error(t('link-expired'));
                return;
            }
            controller.dismissBlockingQR();
            await navigate('/');
        } finally {
            setLoading(false);
        }
    }
    return (
        <>
            <StyledDialogWrapper
                open={true}
                preventDefault={true}
                contentClassName="-translate-y-1/2 p-4"
            >
                <>
                    <div className="w-full flex justify-center mb-4">
                        <HatGlasses className="size-20 rounded-full bg-popover p-4" />
                    </div>
                    <div
                        className="
                        rounded-xl bg-popover
                        shadow-xl
                        py-4 px-6 space-y-4
                        w-full flex flex-col items-center
                        mb-20
                        "
                    >
                        <Dialog.Title className="w-full text-base font-semibold text-center">
                            {t('title')}
                        </Dialog.Title>
                        <Field>
                            <FieldLabel
                                htmlFor="link"
                                className="font-normal text-center"
                            >
                                {t('description')}
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id="link"
                                    placeholder={t('link-placeholder')}
                                    type="text"
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                />
                                <InputGroupAddon>
                                    <Link />
                                </InputGroupAddon>
                            </InputGroup>
                            <FieldError>{linkError}</FieldError>
                        </Field>
                        <div className="flex flex-row gap-2">
                            <Button
                                className="cursor-pointer min-w-38"
                                variant="outline"
                                onClick={() => void setOpenLogout(true)}
                                disabled={loading}
                            >
                                {t('log_out')}
                            </Button>
                            <Button
                                className="cursor-pointer min-w-38"
                                variant="secondary"
                                onClick={() => void onJoin()}
                                disabled={loading}
                            >
                                {!loading && t('join')}
                                {loading && <Spinner />}
                            </Button>
                        </div>
                    </div>
                </>
            </StyledDialogWrapper>

            <LogoutDialog
                open={openLogout}
                onOpenChange={setOpenLogout}
                suggestBindEmail={false}
                onLogout={() => void session.logOut()}
            />
        </>
    );
}

const BlockingQRContext = createContext<BlockingQRController | null>(null);

export interface BlockingQRController {
    shouldBlock: boolean;
    dismissBlockingQR: () => void;
}

export function useBlockingQR(): BlockingQRController {
    const context = useContext(BlockingQRContext);
    if (!context) {
        throw new Error('BlockingQRController only exists in BlockingQRHost');
    }
    return context;
}

export interface BlockingQRProviderProps {
    children: ReactNode;
}

export function BlockingQRProvider({children}: BlockingQRProviderProps) {
    // Hi, Hacker Bro:
    //
    // 1) Yes, it's a client-side thing
    // 2) Yes, you can just fork this repo, write a browser extension or modify localStorage
    // 3) Yes, it's how it works on all platforms
    //
    // But the thing is that we don't care. To start gaining any benefit from
    // the app you must be a part of master network. It's very hard to start a
    // new network right away. You can do it, we encourage you to do that if
    // you want, but it's not a task for an average user.
    //
    const [shouldBlock, setShouldBlock] = useState(() => {
        // TODO(demo): ?demo=1 в dev-режиме пропускает blocking-qr экран
        const demo =
            import.meta.env.DEV &&
            new URLSearchParams(window.location.search).has('demo');
        return (
            !demo && localStorage.getItem('blocking-qr-completed') !== 'true'
        );
    });

    const dismissBlockingQR = () => {
        localStorage.setItem('blocking-qr-completed', 'true');
        setShouldBlock(false);
    };

    const controller: BlockingQRController = useMemo(() => {
        return {shouldBlock, dismissBlockingQR};
    }, [shouldBlock, dismissBlockingQR]);

    return (
        <BlockingQRContext.Provider value={controller}>
            {children}
        </BlockingQRContext.Provider>
    );
}

interface ParseLinkParams {
    raw: string;
}

type ParseLinkResult =
    | {
          ok: true;
          data: {
              userId: number;
              token: string;
          };
      }
    | {
          ok: false;
          message: string;
      };

// Add behavior locality by introducing Deeplink entity that can parse both
// /redirect-like urls and ?reference-like URLs
function parseLink({raw}: ParseLinkParams): ParseLinkResult {
    // https://getfriend.ly/#?reference=add/userId/token
    const parsed = URL.parse(raw);
    if (!parsed) {
        return {
            ok: false,
            message: 'URL.parse(raw)',
        };
    }
    const queryStart = parsed.hash.indexOf('?');
    if (queryStart === -1) {
        return {
            ok: false,
            message: 'indexOf() == -1',
        };
    }
    const hash = parsed.hash.substring(queryStart);
    const searchParams = new URLSearchParams(hash);
    const reference = searchParams.get('reference');
    if (!reference) {
        return {
            ok: false,
            message: '!reference',
        };
    }
    const segments = reference.split('/');
    if (segments.length !== 3) {
        return {
            ok: false,
            message: `segments.length (${segments.length}) != 3`,
        };
    }
    if (segments[0] !== 'add') {
        return {
            ok: false,
            message: `segments[0] (${segments[0]}) != 'add'`,
        };
    }
    const userId = Number(segments[1]);
    if (Number.isNaN(userId)) {
        return {
            ok: false,
            message: 'Number.isNan',
        };
    }
    const token = segments[2];
    return {
        ok: true,
        data: {userId, token},
    };
}
