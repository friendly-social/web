'use client';

import {Spinner} from '@/components/ui/spinner';
import {Textarea} from '@/components/ui/textarea';
import {User, Link, Heart} from 'lucide-react';
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
import {useRouter} from 'next/navigation';
import {useBackend} from '@/backend.context';
import {useState} from 'react';
import {useSession} from '@/components/session-provider';
import {useTranslations} from 'next-intl';

export default function SignInPage() {
    const t = useTranslations('sign_in');

    const router = useRouter();
    const session = useSession();

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

    async function onSignUp() {
        const validated = validator();
        if (!validated) return;
        setLoading(true);
        const result = await backend.generateAccount(
            validated.nickname,
            validated.description,
            validated.interests,
            avatar,
            validated.socialLink,
        );
        setLoading(false);
        if (result.ok) {
            await backend.storeAuthorization(
                result.data.token,
                result.data.id.toString(),
            );
            session.setAuthed();
            router.push('/');
        } else {
            toast.error(t('error-connection'));
        }
    }

    return (
        <div
            className="
            mx-auto
            md:mt-8 md:p-8 md:pt-8 md:max-w-2xl md:rounded-xl md:border md:border-zinc-200 dark:md:border-zinc-800
            bg-white dark:bg-zinc-950
            "
        >
            <div className="relative flex items-center mt-1 mx-1">
                <div className="w-full text-md font-semibold text-center pt-2">
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
                        variant="secondary"
                        onClick={onSignUp}
                        disabled={loading || avatarLoading}
                    >
                        {!loading && t('sign-up')}
                        {loading && <Spinner />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
