import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {cn} from '@/lib/utils';
import {getAvatarFallbackForNickname} from '@/lib/utils';
import React from 'react';

interface StyledAvatarProps {
    avatarClassName: string;
    src: string | undefined;
    nickname: string | undefined;
    onClick?: (event: React.MouseEvent) => void;
    onImageClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
    avatarImageClassName?: string | undefined;
    fallbackClassName?: string;
    fallbackContent?: React.ReactNode;
}

export function StyledAvatar({
    avatarClassName,
    src,
    nickname,
    onClick,
    onImageClick,
    avatarImageClassName,
    fallbackClassName,
    fallbackContent,
}: StyledAvatarProps) {
    const fallbackFromNickname = getAvatarFallbackForNickname(nickname);

    return (
        <Avatar
            className={cn(avatarClassName, onClick ? 'cursor-pointer' : '')}
            onClick={onClick}
        >
            <AvatarImage
                className={cn(
                    avatarImageClassName,
                    onImageClick ? 'cursor-pointer' : '',
                )}
                src={src}
                onClick={onImageClick}
            />
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
