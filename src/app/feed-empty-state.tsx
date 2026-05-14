import {useTranslations} from 'next-intl';

export function FeedEmptyState() {
    const t = useTranslations('profile.feed');

    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {t('empty_title')}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
                {t('empty_desc')}
            </p>
        </div>
    );
}
