import {Spinner} from '@/components/ui/spinner';
import {authService} from '@/services/auth-service';
import {useAppContext} from '@/app.context';
import {Textarea} from '@/components/ui/textarea';
import {User, Link, Heart} from 'lucide-react';
import {useDeferredLink} from '@/app/redirect/[deeplink]/deferred-link';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {FileDescriptor} from '@/types/file-descriptor';
import {MutableAvatarContent} from '@/components/mutable-avatar';
import {toast} from 'sonner';
import {useUserValidator} from '../edit/user-validation';
import {Button} from '@/components/ui/button';
import {useBackend} from '@/backend.context';
import {useState} from 'react';
import {useSession} from '@/components/session-provider';
import {useTranslations} from 'use-intl';
import {useNavigate} from 'react-router';
import * as Notifications from '@/notifications';
import {useBlockingQR} from '@/app/blocking-qr/page';
import {cn} from '@/lib/utils';

export default function SignUpPage() {
    const t = useTranslations('sign-up');

    const app = useAppContext();
    const navigate = useNavigate();
    const session = useSession();
    const [deferredLink, setDeferredLink] = useDeferredLink();
    const blockingQR = useBlockingQR();

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const [nickname, setNickname] = useState('');
    const [nicknameError, setNicknameError] = useState<string | null>();

    const [description, setDescription] = useState('');
    const [descriptionError, setDescriptionError] = useState<string | null>();

    const [socialLink, setSocialLink] = useState('');
    const [socialLinkError, setSocialLinkError] = useState<string | null>();

    const [interests, setInterests] = useState('');
    const [interestsError, setInterestsError] = useState<string | null>();

    const [avatar, setAvatar] = useState<FileDescriptor | null>(null);

    const backend = useBackend();

    const validator = useUserValidator({
        nickname,
        description,
        socialLink,
        interests,
        avatar,
        setNicknameError,
        setDescriptionError,
        setSocialLinkError,
        setInterestsError,
    });

    async function handleAddFriend() {
        const link = deferredLink;
        if (!link) return;
        if (link.type !== 'add-friend') return;
        const {userId, token} = link;
        while (true) {
            // If profile account is created, network conditions were good.
            // If we have a problem after we already created account,
            // it's very hard to rollback. So we just retry indefinitely and
            // show no indication on failure since it's very unlikely also.
            const result = await backend.addFriend({userId, token});
            if (result.ok) {
                if (result.data.type === 'Success') {
                    blockingQR.dismissBlockingQR();
                }
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 1_000));
        }
        setDeferredLink(undefined);
    }

    async function onSignUp() {
        const validated = validator();
        if (!validated) return;
        setLoading(true);
        try {
            const result = await backend.generateAccount(
                validated.nickname,
                validated.description,
                validated.interests,
                avatar,
                validated.socialLink,
            );
            if (result.ok) {
                authService.save(app, result.data);
                backend.setAuthorization(result.data);
                session.setAuthed();
                await handleAddFriend();
                // Same as in the sign-in dialog: the token upload retries on
                // its own, sign-up should not wait for it.
                void Notifications.nudge(app);
                void navigate('/');
            } else {
                toast.error(t('error-connection'));
            }
        } finally {
            setLoading(false);
        }
    }

    async function onSignIn() {
        void navigate('/sign-in');
    }

    return (
        <div className="min-h-dvh w-full flex flex-col">
            <div
                className={cn(
                    'mx-auto w-full',
                    'md:mt-4 md:p-8 md:pt-8 md:max-w-2xl md:rounded-xl md:border md:border-border',
                    'bg-card',
                )}
            >
                <div className="relative flex items-center mt-1 mx-1">
                    <div className="w-full text-base font-semibold text-center pt-2">
                        {t('title')}
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <MutableAvatarContent
                        nickname={nickname}
                        loading={avatarLoading}
                        setLoading={setAvatarLoading}
                        avatar={avatar}
                        setAvatar={setAvatar}
                    />
                    <FieldGroup className="gap-4">
                        <Field>
                            <FieldLabel htmlFor="nickname">
                                {t('nickname')}
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id="nickname"
                                    placeholder={t('nickname-placeholder')}
                                    type="text"
                                    value={nickname}
                                    onChange={e => setNickname(e.target.value)}
                                />
                                <InputGroupAddon>
                                    <User />
                                </InputGroupAddon>
                            </InputGroup>
                            <FieldError>{nicknameError}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="description">
                                {t('description')}
                            </FieldLabel>
                            <Textarea
                                id="description"
                                value={description}
                                placeholder={t('description-placeholder')}
                                onChange={e => setDescription(e.target.value)}
                            />
                            <FieldError>{descriptionError}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="socialLink">
                                {t('social-link')}
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id="socialLink"
                                    type="text"
                                    value={socialLink}
                                    placeholder="https://example.org"
                                    onChange={e =>
                                        setSocialLink(e.target.value)
                                    }
                                />
                                <InputGroupAddon>
                                    <Link />
                                </InputGroupAddon>
                            </InputGroup>
                            <FieldError>{socialLinkError}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="interests">
                                {t('interests')}
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    id="interests"
                                    type="text"
                                    value={interests}
                                    placeholder={t('interests-placeholder')}
                                    onChange={e => setInterests(e.target.value)}
                                />
                                <InputGroupAddon>
                                    <Heart />
                                </InputGroupAddon>
                            </InputGroup>
                            <FieldError>{interestsError}</FieldError>
                        </Field>
                    </FieldGroup>
                    <div className="ml-auto flex flex-col">
                        <Button
                            className="cursor-pointer"
                            variant="secondary"
                            onClick={() => void onSignUp()}
                            disabled={loading || avatarLoading}
                        >
                            {!loading && t('sign-up')}
                            {loading && <Spinner />}
                        </Button>
                        <div className="flex justify-center items-center gap-1">
                            <p className="text-sm">
                                {t('already-have-account')}
                            </p>
                            <Button
                                className="cursor-pointer text-sm p-0"
                                variant="link"
                                onClick={() => void onSignIn()}
                            >
                                {t('sign-in')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
