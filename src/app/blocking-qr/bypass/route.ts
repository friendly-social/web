import {setBlockingQrCompleted} from '@/lib/storage';
import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
    await setBlockingQrCompleted(true);

    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
}
