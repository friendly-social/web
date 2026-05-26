// Mock data generators do not require linting
/* eslint-disable */

import type {UserDetails} from "@/types/user-details";
import {faker} from "@faker-js/faker";

export function getUserDetails(): UserDetails {
    return {
        id: faker.number.int(),
        accessHash: faker.string.uuid(),
        nickname: faker.internet.username(),
        email: faker.internet.email(),
        description: faker.lorem.sentence(),
        interests: Array.from(
            { length: faker.number.int({ min: 1, max: 5 }) },
             
            () => faker.lorem.word(),
        ),
        avatar: null,
        socialLink: null,
    }
}
