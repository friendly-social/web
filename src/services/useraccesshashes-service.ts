interface UserPair {
    id: number;
    accessHash: string;
}

function isUserPair(value: unknown): value is UserPair {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'number' &&
        'accessHash' in value &&
        typeof value.accessHash === 'string'
    );
}

const DB_NAME = 'UserAccessHashesDB';
const STORE_NAME = 'UserAccessHashes';

export class UserAccessHashesService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<IDBDatabase>;

    constructor() {
        if (typeof window === 'undefined') {
            throw new Error('IndexedDB is only available in the browser.');
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
                const target = e.target as IDBOpenDBRequest;
                const db = target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {keyPath: 'id'});
                }
            };

            request.onsuccess = (e: Event) => {
                const target = e.target as IDBOpenDBRequest;
                this.db = target.result;
                resolve(this.db);
            };

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };
        });
    }

    async save(pairs: UserPair[]): Promise<void> {
        if (typeof window === 'undefined') {
            return Promise.reject(
                new Error('IndexedDB is only available in the browser.'),
            );
        }

        const db = this.db || (await this.initPromise);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            for (const pair of pairs) {
                store.put(pair);
            }

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(
                    transaction.error ??
                        new Error('Failed to save a user pair.'),
                );
            transaction.onabort = () =>
                reject(new Error('Transaction aborted'));
        });
    }

    async get(id: number): Promise<UserPair> {
        if (typeof window === 'undefined') {
            return Promise.reject(
                new Error('IndexedDB is only available in the browser.'),
            );
        }

        const db = this.db || (await this.initPromise);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onerror = () => {
                reject(new Error(`Can't get an user pair for id=${id}.`));
            };
            request.onsuccess = () => {
                const pair = request.result as unknown;
                if (!pair)
                    return reject(
                        new Error(`Can't get an user pair for id=${id}.`),
                    );
                if (!isUserPair(pair))
                    return reject(
                        new Error(`Can't get an user pair for id=${id}.`),
                    );
                resolve(pair);
            };
        });
    }

    async reset(): Promise<void> {
        if (typeof window === 'undefined') {
            return Promise.reject(
                new Error('IndexedDB is only available in the browser.'),
            );
        }

        const db = this.db || (await this.initPromise);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () =>
                reject(
                    request.error ?? new Error('Failed to reset user pairs.'),
                );
        });
    }
}
