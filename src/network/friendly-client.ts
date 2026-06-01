import {UserDetails} from '@/types/user-details';
import {FileDescriptor} from '@/types/file-descriptor';
import {BackendLocale} from './backend-locale';
import axios, {AxiosInstance} from 'axios';
import {NetworkError} from '@/network/errors';
import {backendConfig} from './backend-config';
import {err, ok, Result} from './result';

export interface FriendlyClient {
    setAuthToken(token: string | null, userId: string | null): void;
    generateAccount(
        request: GenerateAccountRequest,
    ): Promise<Result<GenerateAccountResponse, NetworkError>>;
    getUserDetails(): Promise<Result<UserDetails, NetworkError>>;
    getUserDetailsById(
        id: number,
        accessHash: string,
    ): Promise<Result<UserDetails, NetworkError>>;
    usersEdit(request: UsersEditRequest): Promise<Result<void, NetworkError>>;
    uploadFile(file: File): Promise<Result<FileDescriptor, NetworkError>>;
    downloadFile(
        id: number,
        accessHash: string,
    ): Promise<Result<Blob, NetworkError>>;
    generateFriendInvitationToken(): Promise<
        Result<GenerateFriendInvitationTokenResponse, NetworkError>
    >;
    friendsGenerateForce(): Promise<
        Result<FriendsGenerateForceResponse, NetworkError>
    >;
    addFriend(
        request: AddFriendRequest,
    ): Promise<Result<AddFriendResponse, NetworkError>>;
    sendFriendRequest(
        request: SendFriendRequest,
    ): Promise<Result<void, NetworkError>>;
    declineFriendRequest(
        request: DeclineFriendRequest,
    ): Promise<Result<void, NetworkError>>;
    getNetworkDetails(): Promise<Result<NetworkDetailsResponse, NetworkError>>;
    getFeedQueue(): Promise<Result<FeedQueueResponse, NetworkError>>;
    emailLink(
        locale: BackendLocale,
        request: EmailLinkRequest,
    ): Promise<Result<void, NetworkError>>;
    emailConfirm(request: EmailConfirmRequest): Promise<Result<void, NetworkError>>;
    emailUnlink(): Promise<Result<void, NetworkError>>;
    authEmail(
        locale: BackendLocale,
        request: AuthEmailRequest,
    ): Promise<Result<void, NetworkError>>;
    authLogin(request: AuthLoginRequest): Promise<Result<AuthLoginResponse, NetworkError>>;
}

export class FriendlyClientImpl implements FriendlyClient {
    private client: AxiosInstance;
    private baseUrl: string;
    private authToken: string | null = null;

    constructor(baseUrl: string = backendConfig.prod) {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    private async safeRequest<T>(
        promise: Promise<T>,
    ): Promise<Result<T, NetworkError>> {
        try {
            const data = await promise;
            return ok(data);
        } catch (e) {
            if (axios.isAxiosError(e)) {
                if (e.response) {
                    if (e.response.status === 401) {
                        return err({
                            type: 'unauthorized',
                            status: e.response.status,
                        });
                    }

                    return err({
                        type: 'status',
                        status: e.response.status,
                    });
                }

                return err({
                    type: 'network',
                    message: e.message,
                });
            }

            return err({
                type: 'unknown',
                message: e instanceof Error ? e.message : 'unknown',
            });
        }
    }

    setAuthToken(token: string | null, userId: string | null) {
        this.authToken = token;
        if (token) {
            this.client.defaults.headers.common['X-User-Id'] = userId;
            this.client.defaults.headers.common['X-Token'] = token;
        } else {
            delete this.client.defaults.headers.common['X-User-Id'];
            delete this.client.defaults.headers.common['X-Token'];
        }
    }

    async generateAccount(
        request: GenerateAccountRequest,
    ): Promise<Result<GenerateAccountResponse, NetworkError>> {
        return this.safeRequest(
            this.client
                .post<GenerateAccountResponse>('/auth/generate', request)
                .then(r => r.data),
        );
    }

    async getUserDetails(): Promise<Result<UserDetails, NetworkError>> {
        return this.safeRequest(
            this.client.get<UserDetails>('/users/details').then(r => r.data),
        );
    }

    async getUserDetailsById(
        id: number,
        accessHash: string,
    ): Promise<Result<UserDetails, NetworkError>> {
        return this.safeRequest(
            this.client
                .get<UserDetails>(`/users/details/${id}/${accessHash}`)
                .then(r => r.data),
        );
    }

    async usersEdit(
        request: UsersEditRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.safeRequest(this.client.patch('/users/edit', request));
    }

    async uploadFile(
        file: File,
    ): Promise<Result<FileDescriptor, NetworkError>> {
        const formData = new FormData();
        formData.append('file', file);

        return this.safeRequest(
            this.client
                .post<FileDescriptor>('/files/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                .then(r => r.data),
        );
    }

    async downloadFile(
        id: number,
        accessHash: string,
    ): Promise<Result<Blob, NetworkError>> {
        return this.safeRequest(
            this.client
                .get<Blob>(`/files/download/${id}/${accessHash}`, {
                    responseType: 'blob',
                })
                .then(r => r.data),
        );
    }

    async generateFriendInvitationToken(): Promise<
        Result<GenerateFriendInvitationTokenResponse, NetworkError>
        > {
        return this.safeRequest(
            this.client
                .post<GenerateFriendInvitationTokenResponse>(
                    '/friends/generate',
                )
                .then(r => r.data),
        );
    }

    async friendsGenerateForce(): Promise<
        Result<FriendsGenerateForceResponse, NetworkError>
        > {
        return this.safeRequest(
            this.client
                .post<GenerateFriendInvitationTokenResponse>(
                    '/friends/generate/force',
                )
                .then(r => r.data),
        );
    }

    async addFriend(
        request: AddFriendRequest,
    ): Promise<Result<AddFriendResponse, NetworkError>> {
        return this.safeRequest(
            this.client
                .post<AddFriendResponse>('/friends/add', request)
                .then(r => r.data),
        );
    }

    async sendFriendRequest(
        request: SendFriendRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.safeRequest(
            this.client.post('/friends/request', request).then(() => undefined),
        );
    }

    async declineFriendRequest(
        request: DeclineFriendRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.safeRequest(
            this.client.post('/friends/decline', request).then(() => undefined),
        );
    }

    async getNetworkDetails(): Promise<
        Result<NetworkDetailsResponse, NetworkError>
        > {
        return this.safeRequest(
            this.client
                .get<NetworkDetailsResponse>('/network/details')
                .then(r => r.data),
        );
    }

    async getFeedQueue(): Promise<Result<FeedQueueResponse, NetworkError>> {
        return this.safeRequest(
            this.client.get<FeedQueueResponse>('/feed/queue').then(r => r.data),
        );
    }

    emailLink(
        locale: 'ru' | 'en',
        request: EmailLinkRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.safeRequest(
            this.client
                .post('/email/link', request, {
                    headers: {
                        'X-Locale': locale,
                    }
                }).then(() => undefined),
        );
    }

    emailConfirm(
        request: EmailConfirmRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.safeRequest(
            this.client
                .post('/email/confirm', request)
                .then(() => undefined),
        );
    }

    emailUnlink(): Promise<Result<void, NetworkError>> {
        return this.safeRequest(
            this.client
                .post('/email/unlink')
                .then(() => undefined),
        );
    }

    authEmail(
        locale: BackendLocale,
        request: AuthEmailRequest,
    ): Promise<Result<void, NetworkError>> {
        return this.safeRequest(
            this.client
                .post('/auth/email', request, {
                    headers: {
                        'X-Locale': locale,
                    }
                }).then(() => undefined),
        );
    }
    authLogin(request: AuthLoginRequest): Promise<Result<AuthLoginResponse, NetworkError>> {
        return this.safeRequest(
            this.client
                .post<AuthLoginResponse>('/auth/login', request)
                .then(r => r.data),
        );
    };
}

export interface GenerateAccountRequest {
    nickname: string;
    description: string;
    interests: string[];
    avatar: FileDescriptor | null;
    socialLink: string | null;
}

export interface GenerateAccountResponse {
    token: string;
    id: number;
    accessHash: string;
}

export interface UsersEditRequest {
    nickname: EditField<string>;
    description: EditField<string>;
    interests: EditField<string[]>;
    socialLink: EditField<string | null>;
    avatar: EditField<FileDescriptor | null>;
}

export interface EditField<T> {
    value: T;
}

export interface GenerateFriendInvitationTokenResponse {
    token: string;
}

export interface FriendsGenerateForceResponse {
    token: string;
}

export interface AddFriendRequest {
    token: string;
    userId: number;
}

export interface AddFriendResponse {
    type: 'FriendTokenExpired' | 'Success';
}

export interface SendFriendRequest {
    userId: number;
    userAccessHash: string;
}

export interface DeclineFriendRequest {
    userId: number;
    userAccessHash: string;
}

export interface NetworkDetailsResponse {
    friends: UserDetails[];
}

export interface CommonFriend {
    id: number;
    accessHash: string;
    nickname: string;
    description: string;
    interests: string[];
    avatar: FileDescriptor | null;
    socialLink: string;
}

export interface FeedItem {
    isRequest: boolean;
    isExtendedNetwork: boolean;
    commonFriends: CommonFriend[];
    details: UserDetails;
}

export interface FeedQueueResponse {
    entries: FeedItem[];
}

export interface EmailLinkRequest {
    email: string;
}

export interface EmailConfirmRequest {
    code: number;
}

export interface AuthEmailRequest {
    email: string;
}

export interface AuthLoginRequest {
    email: string;
    code: number;
}

export interface AuthLoginResponse {
    token: string;
    id: number;
    accessHash: string;
}
