import {initializeApp} from 'firebase/app';
import {AppContext} from '@/app.context';
import {
    getMessaging,
    getToken,
    isSupported,
    onMessage,
    MessagePayload,
    Messaging,
} from 'firebase/messaging';

// Erm... Actually, these are not private
const firebaseConfig = {
    apiKey: 'AIzaSyCNiyRTYRCUC5RrDUevOHh1PIvs-E8m0E0',
    authDomain: 'friendly-e8071.firebaseapp.com',
    projectId: 'friendly-e8071',
    storageBucket: 'friendly-e8071.firebasestorage.app',
    messagingSenderId: '665338758593',
    appId: '1:665338758593:web:9674acf4e970d01c921b40',
    measurementId: 'G-R5K08P6EBR',
};

const app = initializeApp(firebaseConfig);

const VAPID_KEY =
    'BAEj5IbZiBmuUHKNu1Z3hoM5OHEEETG63Lg7mcxxG-kX5t-r5minZEeZTFC-qlW5vYir7mSt3eruuZbr0WcORX0';

const swiped = Number(localStorage.getItem('feed-swipes') ?? '0');

let messagingPromise: Promise<Messaging | null> | undefined;

/**
 * Push is not available everywhere: iOS Safari outside of an installed PWA has
 * no push support at all, and `getMessaging` throws there. This module is
 * imported from the entry point, so a throw on the top level would take down
 * the whole app instead of just the notifications. Hence lazy resolution, and
 * "no messaging" is a normal state, not an error.
 */
async function getMessagingOrNull(): Promise<Messaging | null> {
    messagingPromise ??= (async () => {
        try {
            if (!(await isSupported())) return null;
            const messaging = getMessaging(app);
            onMessage(messaging, message => void postMessage(message));
            return messaging;
        } catch (error) {
            console.warn('Push notifications are unavailable', error);
            return null;
        }
    })();
    return messagingPromise;
}

export function main(app: AppContext) {
    if (
        swiped > 20 ||
        localStorage.getItem('request-notifications') === 'true'
    ) {
        void requestToken(app);
    }
}

async function requestToken(app: AppContext) {
    const messaging = await getMessagingOrNull();
    if (!messaging) return;

    // `isSupported` already checked that Notification exists.
    const permission = await window.Notification.requestPermission();
    if (permission !== 'granted') return;

    let token;
    try {
        token = await getToken(messaging, {vapidKey: VAPID_KEY});
    } catch (error) {
        // No service worker, blocked permission, network -- nothing to do here.
        // The next app start will nudge again.
        console.warn('Failed to obtain a push token', error);
        return;
    }
    if (!token) return;

    setFirebaseToken(token);
    await nudge(app);
}

/**
 * Nudging tries to upload firebase token to server. It happens in these cases:
 *
 * ø  Account sign-up / sign-in
 * |  If user logged in after authorization, we need to notify server about
 * |  this.
 *
 * ø  App initialization
 * |  We need to upload token if previous attempts were not successful.
 *
 * o  Firebase token change
 * |  We need to upload a new token if it was refreshed. Currently no change
 * |  callback is provided by firebase (but it will be provided in the future
 * |  versions).
 */
export async function nudge(app: AppContext) {
    const firebaseToken = getFirebaseToken();
    if (!firebaseToken) return;
    if (firebaseToken === getUploadedToken()) return;

    // Bounded with a growing pause: an unreachable backend used to turn this
    // into a request flood that pinned the tab, and `nudge` is awaited during
    // sign-in, so an endless loop hung the whole flow. Giving up is safe --
    // the doc comment above already relies on the next app start retrying.
    for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) {
            await sleep(Math.min(1_000 * 2 ** (attempt - 1), 30_000));
        }
        const result = await app.backend.authFirebase({firebaseToken});
        if (result.ok) {
            setUploadedToken(firebaseToken);
            return;
        }
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function logout() {
    setUploadedToken(null);
}

function getFirebaseToken(): string | null {
    return localStorage.getItem('notifications.firebaseToken');
}

function setFirebaseToken(value: string | null) {
    if (value === null) {
        localStorage.removeItem('notifications.firebaseToken');
    } else {
        localStorage.setItem('notifications.firebaseToken', value);
    }
}

function getUploadedToken(): string | null {
    return localStorage.getItem('notifications.uploadedToken');
}

function setUploadedToken(value: string | null) {
    if (value === null) {
        localStorage.removeItem('notifications.uploadedToken');
    } else {
        localStorage.setItem('notifications.uploadedToken', value);
    }
}

async function postMessage(payload: MessagePayload) {
    const registration = await navigator.serviceWorker.getRegistration(
        '/firebase-cloud-messaging-push-scope',
    );
    registration?.active?.postMessage(payload);
}

// Bring up the foreground-message bridge as early as before, just without the
// possibility of taking the app down with it.
void getMessagingOrNull();
