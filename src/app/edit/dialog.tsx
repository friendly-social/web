import {useUserValidator, ValidateUserResult} from './user-validation';
import {useAppContext} from '@/app.context';
import * as Dialog from '@radix-ui/react-dialog';
import {MutableAvatarContent} from '@/components/mutable-avatar';
import {UsersEditRequest} from '@/network/friendly-client';
import {Textarea} from '@/components/ui/textarea';
import {toast} from 'sonner';
import {Save, X, User, Link, Heart} from 'lucide-react';
import {useBackend} from '@/backend.context';
import {Spinner} from '@/components/ui/spinner';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {ReactNode, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';
import {UserDetails} from '@/types/user-details';
import {redirect} from 'next/navigation';

interface EditProfileProps {
    userDetails: UserDetails;
    open: boolean;
    setOpen: (value: boolean) => void;
}

// TODO:
// * use https://github.com/arvind-iyer-2001/zepto-chip/tree/master/src/components for interests
export function EditProfileDialog({
    userDetails,
    open,
    setOpen,
}: EditProfileProps): ReactNode {
    const t = useTranslations('edit_profile_dialog');

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const [nickname, setNickname] = useState(userDetails.nickname);
    const [nicknameError, setNicknameError] = useState<string | null>();

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
        setLoading(true);
        const result = await backend.usersEdit(createUsersEdit(validated));
        setLoading(false);
        if (result.ok) {
            setOpen(false);
            document.location.reload();
        } else {
            toast.error(t('error-connection'));
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content
                    className="
                    fixed left-1/2 top-1/2
                    -translate-x-1/2 -translate-y-1/2

                    w-full max-w-lg p-5
                    max-h-screen overflow-y-scroll
                    "
                >
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

                            <Dialog.Close
                                className="absolute right-0 top-0"
                                asChild
                            >
                                <Button
                                    variant="ghost"
                                    className="cursor-pointer"
                                >
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
                                            placeholder={t(
                                                'nickname-placeholder',
                                            )}
                                            value={nickname}
                                            onChange={e =>
                                                setNickname(e.target.value)
                                            }
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
                                        placeholder={t(
                                            'description-placeholder',
                                        )}
                                        onChange={e =>
                                            setDescription(e.target.value)
                                        }
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
                                            placeholder={t(
                                                'interests-placeholder',
                                            )}
                                            onChange={e =>
                                                setInterests(e.target.value)
                                            }
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
                                    onClick={onSave}
                                    disabled={loading || avatarLoading}
                                >
                                    {!loading && (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <p className="hidden sm:block">
                                                {t('save')}
                                            </p>
                                        </>
                                    )}
                                    {loading && <Spinner />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
