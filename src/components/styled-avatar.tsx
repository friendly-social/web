import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {getAvatarFallbackForNickname} from '@/lib/utils';

interface StyledAvatarProps {
    avatarClassName: string;
    src: string | undefined;
    nickname: string | undefined;
    onClick?: () => void;
    avatarImageClassName?: string | undefined;
    fallbackClassName?: string;
    fallbackContent?: React.ReactNode;
}

export function StyledAvatar({
    avatarClassName,
    src,
    nickname,
    onClick,
    avatarImageClassName,
    fallbackClassName,
    fallbackContent,
}: StyledAvatarProps) {
    const fallbackFromNickname = getAvatarFallbackForNickname(nickname);

    return (
        <Avatar className={avatarClassName} onClick={onClick}>
            <AvatarImage className={avatarImageClassName} src={src} />
            <AvatarFallback className={fallbackClassName}>
                {fallbackFromNickname ? (
                    <span>{fallbackFromNickname}</span>
                ) : (
                    fallbackContent
                )}
            </AvatarFallback>
        </Avatar>
    );
}
