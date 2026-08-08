export type NetworkError =
    | {type: 'unknown'; message: string}
    | {type: 'status'; status: number}
    | {type: 'network'; message: string}
    | {type: 'unauthorized'; status: number}
    | {type: 'parse'; message: string};

export function isNetworkError(value: unknown): value is NetworkError {
    if (typeof value !== 'object' || value === null || !('type' in value)) {
        return false;
    }

    return ['unknown', 'status', 'network', 'unauthorized', 'parse'].includes(
        value.type as string,
    );
}

export function isRetryableNetworkError(value: unknown): boolean {
    return isNetworkError(value) && value.type === 'network';
}
