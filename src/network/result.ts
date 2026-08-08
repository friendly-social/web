export type Result<T, E> = {ok: true; data: T} | {ok: false; error: E};

export const ok = <T>(data: T): Result<T, never> => ({ok: true, data});
export const err = <E>(error: E): Result<never, E> => ({ok: false, error});

export function unwrap<T, E extends object>(result: Result<T, E>): T {
    if (!result.ok) throw Object.assign(new Error(), result.error);
    return result.data;
}

export function match<T, E, U>(
    r: Result<T, E>,
    branches: {
        ok: (data: T) => U;
        err: (error: E) => U;
    },
): U {
    return r.ok ? branches.ok(r.data) : branches.err(r.error);
}
