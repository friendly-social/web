import {useBackend} from '@/backend.context';
import {Link2Off} from 'lucide-react';
import {useTranslations} from 'use-intl';
import * as Dialog from '@radix-ui/react-dialog';
import {useNavigate} from 'react-router';
import {useParams} from 'react-router';
import {Spinner} from '@/components/ui/spinner';
import {useEffect, useState, ReactNode} from 'react';
import {useSession} from '@/components/session-provider';
import {useBlockingQR} from '@/app/blocking-qr/page';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {useDeferredLink} from './deferred-link';

type State = 'loading' | 'friend-token-expired';

export default function DeeplinkPage(): ReactNode {
    const navigate = useNavigate();
    const session = useSession();
    const blockingQR = useBlockingQR();
    const backend = useBackend();

    const [handling, setHandling] = useState(false);
    const [state, setState] = useState<State>('loading');
    const {deeplink} = useParams();
    const [_, setDeferredLink] = useDeferredLink();

    async function addFriend(userId: number, token: string) {
        setHandling(true);
        if (session.status === 'guest') {
            setDeferredLink({
                type: 'add-friend',
                userId,
                token,
            });
            void navigate('/sign-up');
            return;
        }
        while (true) {
            const result = await backend.addFriend({userId, token});
            if (!result.ok) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            switch (result.data.type) {
                case 'Success':
                    blockingQR.dismissBlockingQR();
                    void navigate('/');
                    break;
                case 'FriendTokenExpired':
                    setState('friend-token-expired');
                    break;
            }
            break;
        }
    }

    useEffect(() => {
        if (handling) return;
        if (session.status === 'loading') return;
        if (!deeplink) return;

        if (deeplink.startsWith('add/')) {
            const [userId, token] = deeplink.slice(4).split('/');
            return void addFriend(Number(userId), token);
        }

        throw Error(
            'Invalid deeplink, but we are too lazy to create a backup screen',
        );
    }, [deeplink, session.status]);

    switch (state) {
        case 'loading':
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <Spinner className="h-12 w-12" />
                </div>
            );
        case 'friend-token-expired':
            return <FriendTokenExpired />;
    }
}

function FriendTokenExpired() {
    const t = useTranslations('redirect.friend-token-expired');
    return (
        <StyledDialogWrapper
            open={true}
            preventDefault={true}
            popoverBackground={false}
        >
            <>
                <div className="w-full flex justify-center mb-4">
                    <div className="rounded-full bg-popover p-3">
                        <Link2Off className="size-5" />
                    </div>
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
                    <p className="text-base text-center">{t('description')}</p>
                </div>
            </>
        </StyledDialogWrapper>
    );
}
