import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read cookie token (from your existing code)
  const token =
    request.cookies.get("token")?.value ||
    request.cookies.get("user_id")?.value ||
    request.cookies.get("auth-token")?.value;

  // 🆕 Read user group ID (only thing we need to check approval)
  const userGroupIdCookie = request.cookies.get("user_group_id")?.value;
  const userGroupId = userGroupIdCookie ? parseInt(userGroupIdCookie, 10) : null;

  // Skip static assets (from your existing code)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // 👇 These are public routes even WITHOUT login (from your existing code)
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
    "/set-password",
  ];

  // 🆕 Approval-pending route is always accessible for pending users
  const approvalPendingRoute = "/approval-pending";

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // ==================== EXISTING AUTH LOGIC ====================

  // 🚫 Case 1: No token & NOT a public route → redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🔒 Case 2: Logged in user visiting login/register → redirect to home
  if (
    token &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // ==================== NEW APPROVAL LOGIC ====================
  
  // 🆕 SIMPLIFIED: Only use user_group_id to determine approval
  // If user_group_id === 2 → NOT APPROVED
  // Any other group ID → APPROVED
  
  const isNotApproved = userGroupId === 2;

  // 🆕 Case 3: User is not approved (group 2) and not on approval page
  if (isNotApproved && pathname !== approvalPendingRoute) {
    // Allow access to public routes even if not approved
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL(approvalPendingRoute, request.url));
    }
  }

  // 🆕 Case 4: User is approved (not group 2), block them from approval-pending
  if (!isNotApproved && pathname === approvalPendingRoute && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};