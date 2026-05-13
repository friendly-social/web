import {CookiesAsync} from '@/lib/cookies-async';

const KEYS = {
    USER_ID: 'userId',
    TOKEN: 'token',
    QR_COMPLETED: 'blocking-qr-completed',
} as const;

export interface Authorization {
    userId: string;
    token: string;
}

export async function getAuthorization(): Promise<Authorization | undefined> {
    const userId = await CookiesAsync.get(KEYS.USER_ID);
    const token = await CookiesAsync.get(KEYS.TOKEN);

    if (!userId || !token) {
        return undefined;
    }

    return {userId, token};
}

export async function isAuthenticated(): Promise<boolean> {
    return (await getAuthorization()) !== undefined;
}

export async function saveAuthorization(
    token: string,
    userId: string,
): Promise<void> {
    await Promise.all([
        CookiesAsync.set(KEYS.USER_ID, userId),
        CookiesAsync.set(KEYS.TOKEN, token),
    ]);
}

export async function clearAuthorization(): Promise<void> {
    await Promise.all([
        CookiesAsync.remove(KEYS.USER_ID),
        CookiesAsync.remove(KEYS.TOKEN),
    ]);
}

export async function isBlockingQrCompleted(): Promise<boolean> {
    const val = await CookiesAsync.get(KEYS.QR_COMPLETED);
    return val === 'true';
}

export async function setBlockingQrCompleted(
    isCompleted: boolean,
): Promise<void> {
    await CookiesAsync.set(KEYS.QR_COMPLETED, `${isCompleted}`);
}
