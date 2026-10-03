import * as idb from 'idb-keyval';

const KEY = 'image-previewer';

export type Payload =
    | {
          type: 'open';
          src: string;
      }
    | {
          type: 'close';
      };

export async function get(): Promise<Payload | undefined> {
    const result = await idb.get<Payload>(KEY);
    return result;
}

export async function set(payload: Payload) {
    await idb.set(KEY, payload);
}
