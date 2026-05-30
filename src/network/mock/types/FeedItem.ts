import {CommonFriend, FeedItem} from "@/network/friendly-client";
import {faker} from "@faker-js/faker";
import {getUserDetails} from "@/network/mock/types/UserDetails";


export function getFeedItem(): FeedItem {
    return {
        isRequest: faker.number.int({ min: 0, max: 1}) === 1,
        isExtendedNetwork: faker.number.int({ min: 0, max: 1 }) === 1,
        commonFriends: Array.from(
            { length: faker.number.int({ max: 10})},
            () => getUserDetails() as CommonFriend,
        ),
        details: getUserDetails(),
    }
}
