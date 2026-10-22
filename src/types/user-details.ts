import {FileDescriptor} from './file-descriptor';

export type UserId = number & {readonly __brand: unique symbol};

export interface UserDetails {
    id: UserId;
    accessHash: string;
    nickname: string;
    email: string | null;
    description: string;
    interests: string[];
    avatar: FileDescriptor | null;
    socialLink: string | null;
    friendship: Friendship;
}

export type Friendship =
    | 'friends'
    | 'incomingRequest'
    | 'outgoingRequest'
    | 'outgoingDecline'
    | 'none';
