import {backendConfig} from '@/network/backend-config';
import {FileDescriptor} from '@/types/file-descriptor';
import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function createFriendInviteLink(userId: number, token: string) {
    return `${backendConfig.landing}#?reference=add%2F${userId}%2F${token}`;
}

export function createFileLink(descriptor: FileDescriptor): string {
    return `${backendConfig.prod}/files/download/${descriptor.id}/${descriptor.accessHash}`;
}

export function truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength - 3) + '...';
}

export function normalizeLink(str: string) {
    if (str.startsWith('https://') || str.startsWith('http://')) return str;
    return `https://${str}`;
}

export function getAvatarFallbackForNickname(
    nickname: string | undefined,
): string | undefined {
    if (!nickname) return;
    if (nickname.trim().length === 0) return;
    const words = nickname.toUpperCase().split(' ');
    return words
        .slice(0, 2)
        .map(word => word[0])
        .join('');
}
