// Shared by lib/auth.ts and proxy.ts. Kept dependency-free so the proxy
// does not have to pull in Prisma.
let cachedKey: Uint8Array | null = null;

export function getJwtSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey;

  const secret = process.env.JWT_SECRET;
  // The second value was hardcoded in an earlier version of this repo and is public.
  if (!secret || secret.length < 32 || secret === "ticketlagbe-super-secret-key-2026") {
    throw new Error(
      "JWT_SECRET is missing or shorter than 32 characters. Set a long random value in your environment."
    );
  }

  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export const AUTH_COOKIE_NAME = "ticketlagbe_token";
