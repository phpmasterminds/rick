import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read cookie token
  const token =
    request.cookies.get("token")?.value ||
    request.cookies.get("user_id")?.value ||
    request.cookies.get("auth-token")?.value;

  // Skip static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // 👇 These are public routes even WITHOUT login
  const publicRoutes = [
    "/login",
    "/register",
    "/home",
    "/deals",
    "/shop",
    "/featured",
    "/strains",
    "/learn",
    "/dispensary",
    "/coming-soon",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 🚫 Case 1: No token & NOT a public route → redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🔒 Case 2: Logged in user visiting login/register → redirect to home
  if (token && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
