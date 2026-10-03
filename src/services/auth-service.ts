import {Authorization} from '@/types/authorization';
import {FriendlyClientImpl} from '@/network/friendly-client';
import {forceUnwrap} from '@/network/result';
import {AppContext} from '@/app.context';
import * as idb from 'idb-keyval';

export interface Context {
    authorization?: Authorization;
}

export async function initialize(app: AppContext) {
    await migration();
    app.authServiceContext = {
        authorization: await idb.get('auth'),
    };
}

export function save(app: AppContext, authorization?: Authorization) {
    app.authServiceContext.authorization = authorization;
    void idb.set('auth', authorization);
}

export function clear(app: AppContext) {
    save(app, undefined);
}

export function get(app: AppContext) {
    return app.authServiceContext.authorization;
}

async function migration() {
    if (localStorage.getItem('token') && localStorage.getItem('userId')) {
        const friendlyClient = new FriendlyClientImpl();
        friendlyClient.setAuthToken(
            localStorage.getItem('token'),
            localStorage.getItem('userId'),
        );
        let details;
        while (true) {
            try {
                details = forceUnwrap(await friendlyClient.getUserDetails2());
                break;
            } catch (e) {
                console.log(e);
            }
        }
        try {
            const id = Number(localStorage.getItem('userId'));
            const authorization: Authorization = {
                token: localStorage.getItem('token')!,
                id,
                accessHash: details.user.accessHash,
            };
            await idb.set('auth', authorization);
        } finally {
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
        }
    }
}
