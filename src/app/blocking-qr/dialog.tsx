import * as Dialog from '@radix-ui/react-dialog';
import {useState, ReactNode} from 'react';
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
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {setBlockingQrCompleted} from '@/lib/storage';

export function BlockingQR(): ReactNode {
    const t = useTranslations('blocking-qr');
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState('');
    const [linkError, setLinkError] = useState<string | null>();
    const backend = useBackend();

    async function onJoin() {
        setLinkError(null);
        setLoading(true);
        let linkValid;
        let resultSuccess;
        let linkExpired = true;
        try {
            // https://getfriend.ly/#?reference=add/userId/token
            const parsed = URL.parse(link);
            if (!parsed) return;
            const queryStart = parsed.hash.indexOf('?');
            if (queryStart === -1) return;
            const hash = parsed.hash.substring(queryStart);
            const searchParams = new URLSearchParams(hash);
            const reference = searchParams.get('reference');
            if (!reference) return;
            const segments = reference.split('/');
            if (segments.length !== 3) return;
            if (segments[0] !== 'add') return;
            const userId = Number(segments[1]);
            if (Number.isNaN(userId)) return;
            const token = segments[2];
            linkValid = true;
            const result = await backend.addFriend({userId, token});
            if (!result.ok) return;
            resultSuccess = true;
            if (result.data.type === 'FriendTokenExpired') return;
            linkExpired = false;

            await setBlockingQrCompleted(true);
        } finally {
            setLoading(false);
            if (!linkValid) {
                setLinkError(t('link-invalid'));
            } else if (!resultSuccess) {
                toast.error(t('error-connection'));
            } else if (linkExpired) {
                toast.error(t('link-expired'));
            }
        }
    }
    return (
        <Dialog.Root open={true}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content
                    className="
                    fixed left-1/2 top-1/2
                    -translate-x-1/2 -translate-y-1/2

                    w-full max-w-lg p-4
                    max-h-screen overflow-y-scroll
                    "
                    onInteractOutside={e => e.preventDefault()}
                >
                    <div className="w-full flex justify-center mb-4">
                        <HatGlasses className="size-20 rounded-full bg-white dark:bg-zinc-900 p-4" />
                    </div>
                    <div
                        className="
                        rounded-xl bg-white dark:bg-zinc-900
                        shadow-xl
                        py-4 px-6 space-y-4
                        w-full flex flex-col items-center
                        mb-20
                        "
                    >
                        <Dialog.Title className="w-full text-md font-semibold text-center">
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
                        <Button
                            className="cursor-pointer w-30"
                            variant="secondary"
                            onClick={onJoin}
                            disabled={loading}
                        >
                            {!loading && t('join')}
                            {loading && <Spinner />}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
