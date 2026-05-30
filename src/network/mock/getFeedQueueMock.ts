import {getFeedItem} from "@/network/mock/types/FeedItem";
import {Result} from "@/network/result";
import {FeedQueueResponse} from "@/network/friendly-client";
import {NetworkError} from "@/network/errors";

export async function getFeedQueueMock(count= 10): Promise<Result<FeedQueueResponse, NetworkError>> {
    return Promise.resolve({
        ok: true,
        data: {
            entries: Array.from(
                { length: count},
                getFeedItem
            ),
        },
    });
}
