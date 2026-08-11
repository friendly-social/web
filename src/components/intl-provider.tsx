import {IntlProvider as UseIntlProvider} from 'use-intl';
import {useEffect, useState} from 'react';
import en from '../messages/en.json';

type Messages = typeof en;

type PartialMessages<T> = {
    [K in keyof T]?: T[K] extends string ? string : PartialMessages<T[K]>;
};

const loaders: Record<string, () => Promise<{default: PartialMessages<Messages>}>> = {
    en: () => import('../messages/en.json'),
    ru: () => import('../messages/ru.json'),
};

const fallbackLocale = 'en';

function mergeMessages<T>(base: T, override: PartialMessages<T> | undefined): T {
    if (!override) return base;

    const merged = {...base};

    for (const key of Object.keys(base as object) as (keyof T)[]) {
        const value = override[key];
        if (value === undefined) continue;

        merged[key] =
            typeof base[key] === 'object' && base[key] !== null
                ? mergeMessages(base[key], value as PartialMessages<T[keyof T]>)
                : (value as T[keyof T]);
    }

    return merged;
}

export default function IntlProvider({children}: {children: React.ReactNode}) {
    const [messages, setMessages] = useState<Messages | null>(null);
    const [locale, setLocale] = useState(fallbackLocale);

    useEffect(() => {
        const detected = navigator.language.split('-')[0];
        const loc = loaders[detected] ? detected : fallbackLocale;

        loaders[loc]()
            .then(mod => {
                setMessages(mergeMessages(en, mod.default));
                setLocale(loc);
            })
            .catch(() => {
                setMessages(en);
                setLocale(fallbackLocale);
            });
    }, []);

    if (!messages) return null;

    return (
        <UseIntlProvider locale={locale} messages={messages}>
            {children}
        </UseIntlProvider>
    );
}
