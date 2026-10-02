import {CodeDialog, useCodeDialogController} from './code';
import {useBackendLocale} from '@/network/backend-locale';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {Field, FieldError, FieldGroup} from '@/components/ui/field';
import {toast} from 'sonner';
import {Mail} from 'lucide-react';
import {useBackend} from '@/backend.context';
import {Spinner} from '@/components/ui/spinner';
import {ReactNode, useState} from 'react';
import {useTranslations} from 'use-intl';
import {Button} from '@/components/ui/button';
import {useNavigate} from 'react-router';

export default function SignInPage(): ReactNode {
    return (
        <div
            className="
            mx-auto p-8
            md:mt-4 md:pt-8 md:max-w-2xl md:rounded-xl md:border md:border-border
            bg-card
            "
        >
            <SignInContent />
        </div>
    );
}

// This regex is not meant to be a valid check for email.
// Validating in compliance with RFC is very hard and basically no one does it.
// You need to receive email tho.
const emailRegex = /^.*@.*\..*$/;

function SignInContent(): ReactNode {
    const t = useTranslations('sign-in');

    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>();
    const [loading, setLoading] = useState(false);

    const codeDialog = useCodeDialogController();

    const backend = useBackend();
    const locale = useBackendLocale();
    const navigate = useNavigate();

    async function onSend() {
        setError(null);
        if (!emailRegex.test(email)) {
            setError(t('email-invalid'));
            return;
        }
        setLoading(true);
        try {
            const result = await backend.authEmail(locale, {email});
            if (!result.ok) {
                if (result.error.type === 'unauthorized') {
                    setError(t('unknown-email'));
                } else {
                    toast.error(t('error-connection'));
                }
                return;
            }
            void codeDialog.setOpen(true);
        } finally {
            setLoading(false);
        }
    }

    function onSignUp() {
        void navigate('/sign-up');
    }

    return (
        <div className="relative flex flex-col items-center mt-1 mx-1 gap-2">
            <CodeDialog email={email} />
            <p className="w-full text-base font-semibold text-center">
                {t('title')}
            </p>
            <p>{t('description')}</p>
            <FieldGroup className="gap-4">
                <Field>
                    <InputGroup>
                        <InputGroupInput
                            id="email"
                            placeholder={t('email-placeholder')}
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <InputGroupAddon>
                            <Mail />
                        </InputGroupAddon>
                    </InputGroup>
                    <FieldError>{error}</FieldError>
                </Field>
            </FieldGroup>
            <div className="flex flex-col items-center justify-center w-full">
                <Button
                    className="cursor-pointer w-full"
                    variant="secondary"
                    onClick={() => void onSend()}
                    disabled={loading}
                >
                    {loading ? <Spinner /> : <span>{t('send-code')}</span>}
                </Button>
                <div className="flex justify-center items-center gap-1">
                    <p className="text-sm">{t('dont-have-account')}</p>
                    <Button
                        className="cursor-pointer text-sm p-0"
                        variant="link"
                        onClick={onSignUp}
                    >
                        {t('sign-up')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
