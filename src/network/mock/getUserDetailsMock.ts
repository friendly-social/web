import {Result} from "@/network/result";
import {UserDetails} from "@/types/user-details";
import {NetworkError} from "@/network/errors";
import {getUserDetails} from "@/network/mock/types/UserDetails";

export async function getUserDetailsMock(): Promise<Result<UserDetails, NetworkError>> {
    return {
        ok: true,
        data: getUserDetails(),
    }
}
