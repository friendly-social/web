import {initializeApp} from 'firebase/app';
import {AppContext} from '@/app.context';
import {
    getMessaging,
    onMessage,
    MessagePayload,
    onRegistered,
    register,
    unregister,
} from 'firebase/messaging';
import * as auth from '@/services/auth-service';

// Erm... Actually, these are not private
const firebaseConfig = {
    apiKey: 'AIzaSyCNiyRTYRCUC5RrDUevOHh1PIvs-E8m0E0',
    authDomain: 'friendly-e8071.firebaseapp.com',
    projectId: 'friendly-e8071',
    storageBucket: 'friendly-e8071.firebasestorage.app',
    messagingSenderId: '665338758593',
    appId: '1:665338758593:web:9674acf4e970d01c921b40',
    measurementId: 'G-R5K08P6EBR',
    vapidKey: 'BAEj5IbZiBmuUHKNu1Z3hoM5OHEEETG63Lg7mcxxG-kX5t-r5minZEeZTFC-qlW5vYir7mSt3eruuZbr0WcORX0',
};

const firebaseApp = initializeApp(firebaseConfig);

export async function main(app: AppContext) {
    const messaging = getMessaging(firebaseApp);
    onMessage(messaging, message => void postMessage(message));
    onRegistered(messaging, token => void uploadToken(app, token));
    await nudge(app);
}

export function request(app: AppContext) {
    void window.Notification.requestPermission().then(permission => {
        if (permission !== 'granted') return;
        void nudge(app);
    });
}

/**
 * Nudging registers firebase if it is ready to be used. It may be called
 * multiple times if qualifying requirements change.
 *
 * ø  Account sign-up / sign-in
 * |  If user logged in after authorization, we need to notify server about
 * |  this.
 *
 * ø  App initialization
 * |  We need to upload token if previous attempts were not successful.
 */
export async function nudge(app: AppContext) {
    if (window.Notification.permission !== 'granted') return;
    if (auth.get(app) === undefined) return;
    const messaging = getMessaging(firebaseApp);
    await register(messaging, firebaseConfig);
}

async function uploadToken(app: AppContext, firebaseToken: string) {
    if (firebaseToken === getUploadedToken()) return;
    while (true) {
        const result = await app.backend.authFirebase({firebaseToken});
        if (result.ok) break;
    }
    setUploadedToken(firebaseToken);
}

export function logout() {
    const messaging = getMessaging(firebaseApp);
    void unregister(messaging);
    setUploadedToken(null);
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
