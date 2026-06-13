import {REGEXP_ONLY_DIGITS} from 'input-otp';
import {useSession} from '@/components/session-provider';
import {useBlockingQR} from '@/app/blocking-qr/dialog';
import * as Dialog from '@radix-ui/react-dialog';
import {toast} from 'sonner';
import {X} from 'lucide-react';
import {useBackend} from '@/backend.context';
import {Spinner} from '@/components/ui/spinner';
import {ReactNode, useState} from 'react';
import {useTranslations} from 'use-intl';
import {Button} from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from '@/components/ui/input-otp';
import {useNavigate} from 'react-router';
import * as Notifications from '@/notifications';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';

export interface CodeDialogProps {
    email: string;
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function CodeDialog(props: CodeDialogProps): ReactNode {
    const {open, setOpen} = props;
    return (
        <StyledDialogWrapper
            open={open}
            onOpenChange={setOpen}
            preventDefault={true}
            contentClassName="-translate-y-1/2 p-5"
        >
            <CodeDialogContent {...props} />
        </StyledDialogWrapper>
    );
}

function CodeDialogContent({email}: CodeDialogProps): ReactNode {
    const t = useTranslations('code-dialog');

    const [value, setValue] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const backend = useBackend();
    const navigate = useNavigate();
    const session = useSession();
    const blockingQR = useBlockingQR();

    async function onComplete() {
        setError(false);
        if (value.length !== 8) {
            setError(true);
            return;
        }
        setLoading(true);
        try {
            const code = Number(value);
            const result = await backend.authLogin({email, code});
            if (!result.ok) {
                if (result.error.type === 'status') {
                    setError(true);
                } else {
                    toast.error(t('error-connection'));
                }
                return;
            }
            backend.storeAuthorization(
                result.data.token,
                result.data.id.toString(),
            );
            session.setAuthed();
            blockingQR.setShouldBlock(false);
            void Notifications.nudge();
            void navigate('/');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="
        rounded-xl bg-white dark:bg-zinc-900
        shadow-xl
        "
        >
            <div className="relative flex items-center mt-1 mx-1">
                <Dialog.Title className="w-full text-md font-semibold text-center pt-2">
                    {t('title')}
                </Dialog.Title>
                <Dialog.Close className="absolute right-0 top-0" asChild>
                    <Button variant="ghost" className="cursor-pointer">
                        <X />
                    </Button>
                </Dialog.Close>
            </div>
            <div className="p-4 space-y-4 flex flex-col items-center">
                <p className="text-center">{t('code-sent', {email})}</p>
                <InputOTP
                    onComplete={() => void onComplete()}
                    value={value}
                    onChange={setValue}
                    maxLength={8}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} aria-invalid={error} />
                        <InputOTPSlot index={1} aria-invalid={error} />
                        <InputOTPSlot index={2} aria-invalid={error} />
                        <InputOTPSlot index={3} aria-invalid={error} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                        <InputOTPSlot index={4} aria-invalid={error} />
                        <InputOTPSlot index={5} aria-invalid={error} />
                        <InputOTPSlot index={6} aria-invalid={error} />
                        <InputOTPSlot index={7} aria-invalid={error} />
                    </InputOTPGroup>
                </InputOTP>
                <Button
                    onClick={() => void onComplete()}
                    className="w-30"
                    disabled={loading}
                >
                    {!loading && t('continue')}
                    {loading && <Spinner />}
                </Button>
            </div>
        </div>
    );
}
