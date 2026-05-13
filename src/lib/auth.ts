import {redirect} from 'next/navigation';
import {isAuthenticated} from '@/lib/storage';

export async function requireAuthentication(): Promise<void> {
    if (!(await isAuthenticated())) {
        redirect('/signIn');
    }
}
