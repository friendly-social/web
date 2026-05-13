import {redirect} from 'next/navigation';
import {isBlockingQrCompleted} from '@/lib/storage';

export async function requirePassedBlockingQr(): Promise<void> {
    if (!(await isBlockingQrCompleted())) {
        redirect('/blocking-qr');
    }
}
