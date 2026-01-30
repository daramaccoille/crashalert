import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Simple check for /dashboard to ensure user has a cookie or some indicator
    // For this MVP, we will assume "auth" is just a cookie named 'crashalert-user'

    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const authCookie = request.cookies.get('crashalert-user');
        if (!authCookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
}
