import {clearAuthorization} from '@/lib/storage';
import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
    await clearAuthorization();
    const url = request.nextUrl.clone();
    url.pathname = '/signIn';
    return NextResponse.redirect(url);
}
