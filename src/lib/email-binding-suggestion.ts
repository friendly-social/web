import {useCallback, useState} from 'react';

const STORAGE_KEY = 'feed-swipes';
const THRESHOLD = 20;

export type EmailBindingSuggestionStatus =
    | 'pending'
    | 'suggested'
    | 'declined'
    | 'accepted';

export function useEmailBindingSuggestion(userEmail: string | null) {
    const [status, setStatus] =
        useState<EmailBindingSuggestionStatus>('pending');

    const trackSwipe = useCallback(() => {
        const prev = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
        const next = prev + 1;
        localStorage.setItem(STORAGE_KEY, next.toString());
        if (!userEmail && prev < THRESHOLD && next >= THRESHOLD) {
            setStatus('suggested');
        }
    }, [userEmail]);

    return {status, setStatus, trackSwipe};
}
