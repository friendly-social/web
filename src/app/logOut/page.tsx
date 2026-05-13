import {redirect} from 'next/navigation';
import {BackendService} from '@/services/backend-service';
import {FriendlyClientImpl} from '@/network/friendly-client';

export default async function logOut() {
    const backend: BackendService = new BackendService(
        new FriendlyClientImpl(),
    );
    backend.clearAuthorization();
    redirect('/signIn');
}
