import {useAppContext} from '@/app.context';
import {useNavigate, useLocation} from 'react-router';
import {useAppRouter} from '@/components/app-router-provider';
import {users} from '@/services/users-service';
import {REGEXP_ONLY_DIGITS} from 'input-otp';
import * as Dialog from '@radix-ui/react-dialog';
import {toast} from 'sonner';
import {X} from 'lucide-react';
import {useBackend} from '@/backend.context';
import {Spinner} from '@/components/ui/spinner';
import {ReactNode, useState, useEffect} from 'react';
import {useTranslations} from 'use-intl';
import {Button} from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from '@/components/ui/input-otp';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';

type EmailDialogState = {emailDialog?: true} | null;

export interface EmailDialogController {
    open: boolean;
    setOpen: (open: boolean) => Promise<void>;
}

export function useEmailDialogController(): EmailDialogController {
    const router = useAppRouter();
    const location = useLocation();
    const navigate = useNavigate();

    const open = !!(location.state as EmailDialogState)?.emailDialog;

    function setOpen(value: boolean) {
        const location = router.location();
        if (value) {
            return navigate(location, {
                state: {
                    ...(location.state as object),
                    emailDialog: true,
                },
            }) as Promise<void>;
        } else {
            return navigate(-1) as Promise<void>;
        }
    }

    return {
        open,
        setOpen,
    };
}

export interface EmailDialogProps {
    email: string;
}

export function EmailDialog({email}: EmailDialogProps): ReactNode {
    const {open, setOpen} = useEmailDialogController();

    useEffect(() => {
        if (open && email.trim().length === 0) {
            void setOpen(false);
        }
    }, [email, open]);

    if (open && email.trim().length === 0) {
        return;
    }

    return (
        <StyledDialogWrapper
            open={open}
            onOpenChange={value => void setOpen(value)}
        >
            <EmailDialogContent email={email} />
        </StyledDialogWrapper>
    );
}

function EmailDialogContent({email}: EmailDialogProps): ReactNode {
    const t = useTranslations('email-dialog');

    const {setOpen} = useEmailDialogController();
    const [value, setValue] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const backend = useBackend();
    const app = useAppContext();

    async function onComplete() {
        setError(false);
        if (value.length !== 8) {
            setError(true);
            return;
        }
        setLoading(true);
        try {
            const code = Number(value);
            const result = await backend.emailConfirm({code});
            if (!result.ok) {
                if (result.error.type === 'status') {
                    setError(true);
                } else {
                    toast.error(t('error-connection'));
                }
                setLoading(false);
                return;
            }
            const self = users.self(app).data!;
            users.setSelf(app, {
                ...self,
                user: {
                    ...self.user,
                    email,
                },
            });
            void setOpen(false);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="relative flex items-center mt-1 mx-1">
                <Dialog.Title className="w-full text-base font-semibold text-center pt-2">
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
                    onComplete={onComplete}
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
