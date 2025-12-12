import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'demo2025';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Always allow: login page, auth API, static files
  if (
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('site-auth');
  const isAuthenticated = authCookie?.value === SITE_PASSWORD;
  
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // For API routes, return 401 instead of redirect
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Redirect to login page for non-API routes
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

