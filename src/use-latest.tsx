import {RefObject, useEffect, useRef} from 'react';

export function useLatest<T>(data: T): RefObject<T> {
    const ref = useRef(data);
    useEffect(() => {
        ref.current = data;
    }, [data]);
    return ref;
}
