export type NetworkError =
    | {type: 'unknown'; message: string}
    | {type: 'status'; status: number}
    | {type: 'network'; message: string}
    | {type: 'unauthorized'; status: number}
    | {type: 'parse'; message: string};

/**
 * A retry is only useful when the very same request may succeed later: a broken
 * transport or a server-side failure. Rejected credentials, a refused request
 * or a body we cannot parse will fail identically on every attempt, so retrying
 * them just replaces the error state with an endless spinner.
 */
export function isRetriable(error: unknown): boolean {
    if (!isNetworkError(error)) return false;
    switch (error.type) {
        case 'network':
            return true;
        case 'status':
            return error.status >= 500;
        case 'unauthorized':
        case 'parse':
        case 'unknown':
        default:
            return false;
    }
}

/**
 * Queries throw the bare `NetworkError` object (see `forceUnwrap`), not an
 * `Error`, so anything else reaching here is a bug in our own code -- and a bug
 * is not something a retry can fix.
 */
export function isNetworkError(error: unknown): error is NetworkError {
    if (typeof error !== 'object' || error === null) return false;
    const type: unknown = (error as {type?: unknown}).type;
    return (
        type === 'unknown' ||
        type === 'status' ||
        type === 'network' ||
        type === 'unauthorized' ||
        type === 'parse'
    );
}
