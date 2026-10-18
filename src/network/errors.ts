export type NetworkError =
    | {type: 'unknown'; message: string}
    | {type: 'status'; status: number}
    | {type: 'network'; message: string}
    | {type: 'unauthorized'; status: number}
    | {type: 'parse'; message: string};

export function isNetworkError(value: unknown): value is NetworkError {
    return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'string'
    );
}

/**
 * Client errors (4xx) are deterministic, so retrying them is pointless.
 */
export function isRetryable(error: unknown): boolean {
    return !(
        isNetworkError(error) &&
        error.type === 'status' &&
        error.status >= 400 &&
        error.status < 500
    );
}
