import {useCallback} from 'react';
import {useTranslations} from 'use-intl';

// This regex is not meant to be a valid check for URL.
//
// URL check according to specification is not applicable in this case, because
// users will paste URLs like 'x.com/y9san9'.
//
// This check is meant to save from most typos made by users
const socialLinkRegex = /^(https?:\/\/)?\S+\.\S+$/;

interface UserValidatorProps {
    nickname: string;
    description: string;
    socialLink: string;
    interests: string;
    setNicknameError: (value: string | null) => void;
    setDescriptionError: (value: string | null) => void;
    setSocialLinkError: (value: string | null) => void;
    setInterestsError: (value: string | null) => void;
}

/**
 * User validation could be abstracted away from hooks, but simpler approach was
 * chosen for now that does not require many boiletplate on the call site. If
 * there will be a point in pure function that validates user, this should be
 * refactored.
 */
export function useUserValidator(
    props: UserValidatorProps,
): () => ValidateUserResult | undefined {
    const translations = useTranslations('user.validation');
    return useCallback(() => {
        return validateUser({...props, translations});
    }, [props, translations]);
}

export interface ValidateUserProps extends UserValidatorProps {
    translations: ReturnType<typeof useTranslations<'user.validation'>>;
}

export interface ValidateUserResult {
    nickname: string;
    description: string;
    interests: string[];
    socialLink: string | null;
}

export function validateUser({
    translations,
    nickname,
    description,
    socialLink,
    interests,
    setNicknameError,
    setDescriptionError,
    setSocialLinkError,
    setInterestsError,
}: ValidateUserProps): ValidateUserResult | undefined {
    function validateNickname(): string | undefined {
        setNicknameError(null);
        const value = nickname.trim();
        if (!value) {
            setNicknameError(translations('nickname-empty'));
            return;
        }
        if (value.length > 256) {
            setNicknameError(translations('nickname-long'));
            return;
        }
        return value;
    }

    function validateDescription(): string | undefined {
        setDescriptionError(null);
        const value = description.trim();
        if (value.length === 0) {
            setDescriptionError(translations('description-empty'));
            return;
        }
        if (value.length > 10240) {
            setDescriptionError(translations('description-long'));
            return;
        }
        return value;
    }

    function validateSocialLink(): [boolean, string | null] {
        setSocialLinkError(null);
        const value = socialLink.trim();
        if (value.length === 0) {
            return [true, null];
        }
        if (!socialLinkRegex.test(value)) {
            setSocialLinkError(translations('social-link-invalid'));
            return [false, null];
        }
        if (value.length > 2048) {
            setSocialLinkError(translations('social-link-too-long'));
            return [false, null];
        }
        return [true, value];
    }

    function validateInterests(): [boolean, string[]] {
        setInterestsError(null);
        if (interests.trim().length === 0) {
            return [true, []];
        }
        const value = interests.trim().split(',');
        if (value.length > 100) {
            setInterestsError(translations('interests-too-many'));
            return [false, []];
        }
        const validated: string[] = [];
        for (let interest of value) {
            interest = interest.trim();
            if (interest.length === 0) {
                setInterestsError(translations('interest-empty'));
                return [false, []];
            }
            if (interest.length > 64) {
                setInterestsError(translations('interest-too-long'));
                return [false, []];
            }
            if (validated.includes(interest)) {
                setInterestsError(
                    translations('interest-duplicate', {interest}),
                );
                return [false, []];
            }
            validated.push(interest);
        }
        return [true, validated];
    }

    function validateAll() {
        const nickname = validateNickname();
        const description = validateDescription();
        const [socialLinkValid, socialLink] = validateSocialLink();
        const [interestsValid, interests] = validateInterests();
        if (!nickname || !description || !interestsValid || !socialLinkValid) {
            return;
        }
        return {
            nickname,
            description,
            socialLink,
            interests,
        };
    }

    return validateAll();
}
