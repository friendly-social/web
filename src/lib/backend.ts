import {cache} from 'react';
import {BackendService} from '@/services/backend-service';
import {FriendlyClientImpl} from '@/network/friendly-client';

export const getBackend = cache(() => {
    return new BackendService(new FriendlyClientImpl());
});
