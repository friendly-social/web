export const CookiesAsync = {
    get: async (name: string): Promise<string | undefined> => {
        if (typeof window === 'undefined') {
            const {cookies} = await import('next/headers');
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
        }

        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift();
        }

        return undefined;
    },

    set: async (name: string, value: string, days = 7): Promise<void> => {
        if (typeof window === 'undefined') {
            const {cookies} = await import('next/headers');
            const cookieStore = await cookies();

            cookieStore.set(name, value, {
                maxAge: days * 24 * 60 * 60,
                path: '/',
                sameSite: 'strict',
                secure: true,
            });

            return;
        }

        const expires = new Date(Date.now() + days * 864e5).toUTCString();

        document.cookie =
            `${name}=${value}; ` +
            `expires=${expires}; ` +
            'path=/; ' +
            'SameSite=Strict; ' +
            'Secure';
    },

    remove: async (name: string): Promise<void> => {
        if (typeof window === 'undefined') {
            const {cookies} = await import('next/headers');
            const cookieStore = await cookies();

            cookieStore.delete(name);
            return;
        }

        document.cookie =
            `${name}=; ` +
            'expires=Thu, 01 Jan 1970 00:00:00 UTC; ' +
            'path=/;';
    },
};
