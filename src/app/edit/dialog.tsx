import {useUserValidator, ValidateUserResult} from './user-validation';
import {useAppContext} from '@/app.context';
import {users} from '@/services/users-service';
import {useEffect} from 'react';
import {useBackendLocale} from '@/network/backend-locale';
import {EmailDialog} from './email-dialog';
import * as Dialog from '@radix-ui/react-dialog';
import {MutableAvatarContent} from '@/components/mutable-avatar';
import {UsersEditRequest} from '@/network/friendly-client';
import {toast} from 'sonner';
import {Save, X, User, Mail, Link, Heart} from 'lucide-react';
import {useBackend} from '@/backend.context';
import {Spinner} from '@/components/ui/spinner';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {ReactNode, useState} from 'react';
import {useTranslations} from 'use-intl';
import {Button} from '@/components/ui/button';
import {StyledDialogWrapper} from '@/components/styled-dialog-wrapper';
import {Textarea} from '@/components/ui/textarea';

interface EditProfileProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

// TODO:
// * use https://github.com/arvind-iyer-2001/zepto-chip/tree/master/src/components for interests
export function EditProfileDialog(props: EditProfileProps): ReactNode {
    const {open, setOpen} = props;
    return (
        <StyledDialogWrapper open={open} onOpenChange={setOpen}>
            <EditProfileDialogContent {...props} />
        </StyledDialogWrapper>
    );
}

function EditProfileDialogContent({setOpen}: EditProfileProps): ReactNode {
    const t = useTranslations('edit_profile_dialog');
    const app = useAppContext();

    const userDetails = users.useSelf(app).data!.user;

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const [nickname, setNickname] = useState(userDetails.nickname);
    const [nicknameError, setNicknameError] = useState<string | null>();

    const savedEmail = userDetails.email ?? '';
    const [email, setEmail] = useState(savedEmail);
    const [emailError, setEmailError] = useState<string | undefined>(undefined);
    const emailChanged = savedEmail !== email;

    const [emailOpen, setEmailOpen] = useState(false);

    useEffect(() => {
        setEmail(savedEmail);
    }, [savedEmail]);

    const [description, setDescription] = useState(userDetails.description);
    const [descriptionError, setDescriptionError] = useState<string | null>();

    const [socialLink, setSocialLink] = useState(userDetails.socialLink ?? '');
    const [socialLinkError, setSocialLinkError] = useState<string | null>();

    const [interests, setInterests] = useState(
        userDetails.interests.join(', '),
    );
    const [interestsError, setInterestsError] = useState<string | null>();

    const [avatar, setAvatar] = useState(userDetails.avatar);

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

    function createUsersEdit(result: ValidateUserResult): UsersEditRequest {
        return {
            nickname: {value: result.nickname},
            description: {value: result.description},
            interests: {value: result.interests},
            socialLink: {value: result.socialLink},
            avatar: {value: avatar},
        };
    }

    async function onSave() {
        const validated = validator();
        if (!validated) return;
        if (emailChanged) {
            setEmailError(t('email-verification-required'));
            return;
        } else {
            setEmailError(undefined);
        }
        setLoading(true);
        const result = await backend.usersEdit(createUsersEdit(validated));
        setLoading(false);
        if (result.ok) {
            setOpen(false);
            const self = users.self(app).data!;
            users.setSelf(app, {
                ...self,
                user: {
                    ...self.user,
                    ...validated,
                    avatar,
                },
            });
        } else {
            toast.error(t('error-connection'));
        }
    }

    return (
        <>
            <EmailDialog
                email={email}
                open={emailOpen}
                setOpen={setEmailOpen}
            />
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
                                type="text"
                                placeholder={t('nickname-placeholder')}
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                            />
                            <InputGroupAddon>
                                <User />
                            </InputGroupAddon>
                        </InputGroup>
                        <FieldError>{nicknameError}</FieldError>
                    </Field>
                    <EmailInput
                        savedEmail={savedEmail}
                        email={email}
                        setEmail={setEmail}
                        emailError={emailError}
                        setEmailError={setEmailError}
                        setEmailOpen={() => setEmailOpen(true)}
                    />
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
                                onChange={e => setSocialLink(e.target.value)}
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
                <div className="ml-auto flex flex-col gap-2">
                    <Button
                        className="cursor-pointer"
                        variant="default"
                        onClick={() => void onSave()}
                        disabled={loading || avatarLoading}
                    >
                        {!loading && (
                            <>
                                <Save className="w-4 h-4" />
                                <p className="hidden sm:block">{t('save')}</p>
                            </>
                        )}
                        {loading && <Spinner />}
                    </Button>
                </div>
            </div>
        </>
    );
}

interface EmailInputProps {
    savedEmail: string;
    email: string;
    emailError: string | undefined;
    setEmailError: (value: string | undefined) => void;
    setEmail: (value: string) => void;
    setEmailOpen: () => void;
}

// This regex is not meant to be a valid check for email.
// Validating in compliance with RFC is very hard and basically no one does it.
// You need to receive email tho.
const emailRegex = /^.*@.*\..*$/;

function EmailInput({
    savedEmail,
    email,
    emailError,
    setEmailError,
    setEmail,
    setEmailOpen,
}: EmailInputProps): ReactNode {
    const t = useTranslations('edit_profile_dialog');
    const emailChanged = savedEmail !== email;
    const emailEmpty = email.trim().length === 0;
    const [loading, setLoading] = useState(false);
    const backend = useBackend();
    const locale = useBackendLocale();

    const [openUnlink, setOpenUnlink] = useState(false);

    const app = useAppContext();

    async function onOpen() {
        setLoading(true);
        setEmailError(undefined);
        try {
            if (!emailRegex.test(email)) {
                setEmailError(t('email-invalid'));
                return;
            }
            const result = await backend.emailLink(locale, {email});
            if (result.ok) {
                setEmailOpen();
            } else {
                if (result.error.type === 'status') {
                    setEmailError(t('email-used'));
                } else {
                    setEmailError(t('error-connection'));
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function onUnlink() {
        setLoading(true);
        setEmailError(undefined);
        try {
            const result = await backend.emailUnlink();
            if (!result.ok) {
                setEmailError(t('error-connection'));
                return;
            }
            const self = users.self(app).data!;
            users.setSelf(app, {
                ...self,
                user: {
                    ...self.user,
                    email: null,
                },
            });
        } finally {
            setLoading(false);
            setOpenUnlink(false);
        }
    }

    return (
        <Field>
            <FieldLabel htmlFor="email">{t('email')}</FieldLabel>
            <InputGroup>
                <InputGroupInput
                    id="email"
                    type="email"
                    placeholder={t('email-placeholder')}
                    value={email}
                    onChange={e => {
                        setEmail(e.target.value);
                    }}
                />
                <InputGroupAddon>
                    <Mail />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                    {loading ? (
                        <Spinner />
                    ) : emailChanged && !emailEmpty ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void onOpen()}
                        >
                            {t('email-verify')}
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => savedEmail && setOpenUnlink(true)}
                        >
                            <X />
                        </Button>
                    )}
                </InputGroupAddon>
            </InputGroup>
            <FieldError>{emailError}</FieldError>
            <StyledDialogWrapper open={openUnlink} onOpenChange={setOpenUnlink}>
                <div>
                    <div className="relative flex items-center mt-1 mx-1">
                        <Dialog.Title className="w-full text-base font-semibold text-center pt-2">
                            {t('email-unlink-sure')}
                        </Dialog.Title>

                        <Dialog.Close
                            className="absolute right-0 top-0"
                            asChild
                        >
                            <Button variant="ghost" className="cursor-pointer">
                                <X />
                            </Button>
                        </Dialog.Close>
                    </div>
                    <div className="p-4 space-y-4 flex flex-col items-center">
                        <p className="text-center">
                            {t('email-unlink-sure-verbose')}
                        </p>
                        <div className="flex gap-2 items-end">
                            <Button
                                className="cursor-pointer"
                                variant="outline"
                                onClick={() => setOpenUnlink(false)}
                                disabled={loading}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                className="cursor-pointer"
                                onClick={() => void onUnlink()}
                                disabled={loading}
                            >
                                {!loading && t('continue')}
                                {loading && <Spinner />}
                            </Button>
                        </div>
                    </div>
                </div>
            </StyledDialogWrapper>
        </Field>
    );
}
