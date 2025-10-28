import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ✅ Match your real cookie name — you mentioned it's "token" or "access_token"
  const token =
    request.cookies.get('token')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('auth-token')?.value;

  const { pathname } = request.nextUrl;

  // Define which routes are public (no login needed)
  const publicRoutes = ['/login', '/register','/home', '/deals','/shop', '/featured', '/strains', '/learn'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // ✅ Case 1: If NO token and accessing a protected route → redirect to /login
  if (!token && !isPublicRoute && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ✅ Case 2: If token exists and trying to visit login/register → redirect to /dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ✅ Otherwise, allow request
  return NextResponse.next();
}

// ✅ Run middleware on all app routes except static assets
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
