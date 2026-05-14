import {UserDetails} from '@/types/user-details';
import {FileDescriptor} from '@/types/file-descriptor';
import {
    DeclineFriendRequest,
    FeedQueueResponse,
    FriendlyClient,
    GenerateAccountResponse,
    NetworkDetailsResponse,
    SendFriendRequest,
} from '@/network/friendly-client';
import {NetworkError} from '@/network/errors';
import {err, ok, Result} from '@/network/result';
import {
    clearAuthorization,
    getAuthorization,
    saveAuthorization,
} from '@/lib/storage';

// FIXME: this is not localized
export function formatNetworkError(error: NetworkError): string {
    switch (error.type) {
        case 'unauthorized':
            return `Unauthorized (status ${error.status})`;
        case 'network':
            return `Network error: ${error.message}`;
        case 'parse':
            return `Parse error: ${error.message}`;
        case 'unknown':
        default:
            return `Unknown error: ${error.message}`;
    }
}

export function mapResult<T, U>(
    result: Result<T, NetworkError>,
    map: (value: T) => U,
): Result<U, NetworkError> {
    return result.ok ? ok(map(result.data)) : err(result.error);
}

export class BackendService {
    constructor(private client: FriendlyClient) {}

    /**
     * Try to restore auth from cookies if possible.
     *
     * @returns true if auth restored successfully.
     */
    async restoreAuthorizationIfPossible(): Promise<boolean> {
        const authorization = await getAuthorization();

        if (!authorization) return false;

        this.client.setAuthToken(authorization.token, authorization.userId);
        return true;
    }

    async storeAuthorization(token: string, userId: string) {
        this.client.setAuthToken(token, userId);
        await saveAuthorization(token, userId);
    }

    async clearAuthorization() {
        this.client.setAuthToken(null, null);
        await clearAuthorization();
    }

    async getUserDetails(): Promise<Result<UserDetails, NetworkError>> {
        return await this.client.getUserDetails();
    }

    usersEdit: typeof this.client.usersEdit = (...args) => {
        return this.client.usersEdit(...args);
    };

    async generateAccount(
        nickname: string,
        description: string,
        interests: string[],
        avatar: FileDescriptor | null,
        socialLink: string | null,
    ): Promise<Result<GenerateAccountResponse, NetworkError>> {
        return this.client.generateAccount({
            nickname,
            description,
            interests,
            avatar,
            socialLink,
        });
    }

    async generateFriendInvitationToken(): Promise<
        Result<string, NetworkError>
    > {
        const result = await this.client.generateFriendInvitationToken();
        return mapResult(result, data => data.token);
    }

    async getNetworkDetails(): Promise<
        Result<NetworkDetailsResponse, NetworkError>
    > {
        return await this.client.getNetworkDetails();
    }

    async getFeedQueue(): Promise<Result<FeedQueueResponse, NetworkError>> {
        return await this.client.getFeedQueue();
    }

    addFriend: typeof this.client.addFriend = (...args) => {
        return this.client.addFriend(...args);
    };

    async sendFriendRequest(
        request: SendFriendRequest,
    ): Promise<Result<void, NetworkError>> {
        return await this.client.sendFriendRequest(request);
    }

    async declineFriendRequest(
        request: DeclineFriendRequest,
    ): Promise<Result<void, NetworkError>> {
        return await this.client.declineFriendRequest(request);
    }

    async uploadFile(
        file: File,
    ): Promise<Result<FileDescriptor, NetworkError>> {
        return await this.client.uploadFile(file);
    }
}
