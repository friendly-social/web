import {redirect} from 'next/navigation';
import {CookiesAsync} from '@/lib/cookies-async';

export default async function Bypass() {
    await CookiesAsync.set('blocking-qr-completed', 'true');
    redirect('/');
}
