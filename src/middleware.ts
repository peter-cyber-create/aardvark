import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Clone the response headers
  const response = NextResponse.next();
  const headers = new Headers(response.headers);

  // Add security headers
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Handle authentication
  if (path.startsWith('/dashboard') || path.startsWith('/api')) {
    const token = await getToken({ req: request });
    
    if (!token && !path.startsWith('/api/auth')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Redirect root to dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Return response with security headers
  return NextResponse.next({
    request: {
      headers: headers,
    },
  });
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/staff/:path*',
    '/dashboard/:path*',
    // Exclude auth pages from protection
    '/((?!api|_next/static|_next/image|favicon.ico|auth/login|auth/error).*)',
  ],
};
