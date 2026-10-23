import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "ticketlagbe-secret-key"
);

// যেসব page login ছাড়া ব্যবহার করা যাবে
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files এবং Next.js internal files বাদ
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public page হলে সরাসরি allow
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Login cookie check
  const token = request.cookies.get("ticketlagbe_token")?.value;

  // Cookie না থাকলে login page-এ পাঠাবে
  if (!token) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // Token valid কিনা check
  try {
    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch {
    // Invalid/expired token হলে login page
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl);

    // পুরোনো invalid cookie delete
    response.cookies.delete("ticketlagbe_token");

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * সব route middleware-এর মধ্যে যাবে
     * উপরের code public/static route বাদ দেবে
     */
    "/((?!api).*)",
  ],
};