import {useTranslations} from 'use-intl';
import {isNetworkError} from '@/network/errors';

/**
 * Queries and mutations throw the bare `NetworkError` object (see
 * `forceUnwrap`), and half of its variants carry no `message` at all. Reading
 * `error.message` in a screen therefore printed either nothing or the raw
 * untranslated axios string -- an English "Network Error" in a Russian UI.
 *
 * Every message here answers "what do I do now", which is why a rejected
 * request and a broken server read differently even though both are just a
 * status code.
 */
export function useErrorMessage(): (error: unknown) => string {
    const t = useTranslations('errors');

    return (error: unknown) => {
        if (!isNetworkError(error)) return t('unknown');
        switch (error.type) {
            case 'network':
                return t('network');
            case 'unauthorized':
                return t('unauthorized');
            case 'status':
                return error.status >= 500 ? t('server') : t('request');
            case 'parse':
            case 'unknown':
            default:
                return t('unknown');
        }
    };
}
