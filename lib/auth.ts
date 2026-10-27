import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getJwtSecretKey } from "@/lib/jwt-secret";

export interface AuthSessionPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signAuthToken(payload: AuthSessionPayload, expiresIn = "7d"): Promise<string> {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecretKey());
}

export async function verifyAuthToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.role as string) || "BUYER",
    };
  } catch {
    return null;
  }
}

function readToken(request: Request): string | null {
  // 1. Authorization header (mobile app)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Cookie header (web)
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const tokenCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${AUTH_COOKIE_NAME}=`));

  return tokenCookie?.split("=")[1]?.trim() || null;
}

/**
 * Resolves the signed-in user. The token only proves identity: role and
 * account status are always read from the database, so a ban or role change
 * takes effect immediately instead of when the 7-day token expires.
 */
export async function getAuthUser(request: Request): Promise<AuthSessionPayload | null> {
  const token = readToken(request);
  if (!token) return null;

  const claims = await verifyAuthToken(token);
  if (!claims) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: claims.userId },
      select: { id: true, email: true, role: true, accountStatus: true },
    });

    if (!user || user.accountStatus !== "ACTIVE") return null;

    return { userId: user.id, email: user.email, role: user.role };
  } catch (error) {
    console.error("getAuthUser database lookup error:", error);
    return null;
  }
}

export async function getFullAuthUser(request: Request) {
  const session = await getAuthUser(request);
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("getFullAuthUser database lookup error:", error);
    return null;
  }
}
