import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "ticketlagbe-super-secret-key-2026";
const secretKey = new TextEncoder().encode(JWT_SECRET_STRING);

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
    .sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.role as string) || "BUYER",
    };
  } catch {
    return null;
  }
}

export async function getAuthUser(request: Request): Promise<AuthSessionPayload | null> {
  // 1. Try Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      return await verifyAuthToken(token);
    }
  }

  // 2. Try Cookie header
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const tokenCookie = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("ticketlagbe_token="));

  if (!tokenCookie) {
    return null;
  }

  const token = tokenCookie.split("=")[1]?.trim();
  if (!token) {
    return null;
  }

  return await verifyAuthToken(token);
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
