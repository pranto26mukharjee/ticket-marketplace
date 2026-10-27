import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME, getJwtSecretKey } from "@/lib/jwt-secret";

// Pages that can be visited without logging in
const publicExactRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/tickets",
  "/admin/login",
  "/how-it-works",
];

// Optimistic check only: API routes re-validate the user (role and ban status)
// against the database on every request.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, Next.js internal chunks, images, icons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public exact routes
  if (publicExactRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public ticket viewing (/tickets/[id]), but not the seller edit page
  if (pathname.startsWith("/tickets/") && !pathname.endsWith("/edit")) {
    return NextResponse.next();
  }

  // Check login cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    // If trying to access admin backoffice without login, send to admin login
    if (pathname.startsWith("/admin")) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(adminLoginUrl);
    }

    const fullPath = pathname + request.nextUrl.search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const role = (payload.role as string) || "BUYER";

    // Role-based protection for /admin routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (role !== "ADMIN") {
        // Non-admin user trying to access admin portal
        const redirectUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    const fullPath = pathname + request.nextUrl.search;
    const loginUrl = new URL(
      pathname.startsWith("/admin") ? "/admin/login" : "/login",
      request.url
    );
    loginUrl.searchParams.set("redirect", fullPath);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Run on all application pages except API and static assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
