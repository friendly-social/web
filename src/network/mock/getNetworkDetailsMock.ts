import {NetworkDetailsResponse} from "@/network/friendly-client";
import {NetworkError} from "@/network/errors";
import {Result} from "@/network/result";
import {getUserDetails} from "@/network/mock/types/UserDetails";

export function getNetworkDetailsMock(countFriends = 10): Promise<Result<NetworkDetailsResponse, NetworkError>> {
    return Promise.resolve({
        ok: true,
        data: {
            friends: Array.from(
                { length: countFriends },
                () => getUserDetails()
            )
        }
    })
}
