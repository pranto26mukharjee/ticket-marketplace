import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "ticketlagbe-super-secret-key-2026"
);

// Strictly public pages allowed without logging in
const publicExactRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/admin/login",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, Next.js internal chunks, images, icons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow strictly public exact routes
  if (publicExactRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check login cookie
  const token = request.cookies.get("ticketlagbe_token")?.value;

  if (!token) {
    // If trying to access admin backoffice without login, send to admin login
    if (pathname.startsWith("/admin")) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(adminLoginUrl);
    }

    // All other pages (including /tickets, /tickets/[id], /create-listing, /messages, /dashboard)
    // require authenticated login
    const fullPath = pathname + request.nextUrl.search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    const { payload } = await jwtVerify(token, secret);
    const role = (payload.role as string) || "BUYER";

    // Role-based protection for /admin routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (role !== "ADMIN") {
        // Non-admin user trying to access admin backoffice
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
    response.cookies.delete("ticketlagbe_token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Run middleware on all application pages except API and static assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
