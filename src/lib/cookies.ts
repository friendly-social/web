export const Cookies = {
    get: (name: string): string | undefined => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
    },
    set: (name: string, value: string, days = 7) => {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        // Secure: Sent only over HTTPS; SameSite=Strict: Prevents CSRF
        document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict; Secure`;
    },
    remove: (name: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },
};
