import {FileDescriptor} from '@/types/file-descriptor';
import {Authorization} from '@/types/authorization';
import {
    DeclineFriendRequest,
    FeedQueueResponse,
    FriendlyClient,
    GenerateAccountResponse,
    UserDetailsResponse,
    CommunityPostRequest,
    CommunityListRequest,
    CommunityListResponse,
    CommunityRepliesRequest,
    CommunityRepliesResponse,
    CommunityDetailsRequest,
    CommunityDetailsResponse,
    CommunityDeleteRequest,
    CommunityEditRequest,
    ActivityListRequest,
    ActivityListResponse,
    ActivityReadRequest,
    NetworkDetailsResponse,
    SendFriendRequest,
    CommunityPostDescriptor,
    CommunityPostId,
} from '@/network/friendly-client';
import {NetworkError} from '@/network/errors';
import {err, ok, Result} from '@/network/result';

export function mapResult<T, U>(
    result: Result<T, NetworkError>,
    map: (value: T) => U,
): Result<U, NetworkError> {
    return result.ok ? ok(map(result.data)) : err(result.error);
}

export class BackendService {
    constructor(private client: FriendlyClient) {}

    setAuthorization(auth: Authorization) {
        this.client.setAuthToken(auth.token, auth.id.toString());
    }

    clearAuthorization() {
        this.client.setAuthToken(null, null);
    }

    async getUserDetails2(): Promise<
        Result<UserDetailsResponse, NetworkError>
    > {
        return await this.client.getUserDetails2();
    }

    async getUserDetailsById2(
        id: number,
        accessHash: string,
    ): Promise<Result<UserDetailsResponse, NetworkError>> {
        return this.client.getUserDetailsById2(id, accessHash);
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

    friendsGenerateForce: typeof this.client.friendsGenerateForce = (
        ...args
    ) => {
        return this.client.friendsGenerateForce(...args);
    };

    async getNetworkDetails(): Promise<
        Result<NetworkDetailsResponse, NetworkError>
    > {
        return await this.client.getNetworkDetails();
    }

    async getFeedQueue(): Promise<Result<FeedQueueResponse, NetworkError>> {
        return await this.client.getFeedQueue();
    }

    emailLink: typeof this.client.emailLink = (...args) => {
        return this.client.emailLink(...args);
    };

    emailConfirm: typeof this.client.emailConfirm = (...args) => {
        return this.client.emailConfirm(...args);
    };

    emailUnlink: typeof this.client.emailUnlink = (...args) => {
        return this.client.emailUnlink(...args);
    };

    authEmail: typeof this.client.authEmail = (...args) => {
        return this.client.authEmail(...args);
    };

    authLogin: typeof this.client.authLogin = (...args) => {
        return this.client.authLogin(...args);
    };

    authFirebase: typeof this.client.authFirebase = (...args) => {
        return this.client.authFirebase(...args);
    };

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

    async communityPost(
        request: CommunityPostRequest,
    ): Promise<Result<CommunityPostDescriptor, NetworkError>> {
        return this.client.communityPost(request);
    }

    async communityList(
        request: CommunityListRequest,
    ): Promise<Result<CommunityListResponse, NetworkError>> {
        return this.client.communityList(request);
    }

    async communityDetails(
        request: CommunityDetailsRequest,
    ): Promise<Result<CommunityDetailsResponse, NetworkError>> {
        return this.client.communityDetails(request);
    }

    async communityReplies(
        request: CommunityRepliesRequest,
    ): Promise<Result<CommunityRepliesResponse, NetworkError>> {
        return this.client.communityReplies(request);
    }

    communityDelete(
        request: CommunityDeleteRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.client.communityDelete(request);
    }

    communityEdit(
        id: CommunityPostId,
        request: CommunityEditRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.client.communityEdit(id, request);
    }

    async activityList(
        request: ActivityListRequest,
    ): Promise<Result<ActivityListResponse, NetworkError>> {
        return this.client.activityList(request);
    }

    async activityRead(
        request: ActivityReadRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.client.activityRead(request);
    }
}
