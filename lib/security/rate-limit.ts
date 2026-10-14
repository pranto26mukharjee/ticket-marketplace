import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class SlidingWindowRateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodic cleanup of stale records every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.requests.entries()) {
        if (now > record.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 120000);
  }

  check(key: string): { success: boolean; remaining: number; resetSeconds: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        success: true,
        remaining: this.maxRequests - 1,
        resetSeconds: Math.ceil(this.windowMs / 1000),
      };
    }

    if (record.count >= this.maxRequests) {
      const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      return {
        success: false,
        remaining: 0,
        resetSeconds,
      };
    }

    record.count += 1;
    return {
      success: true,
      remaining: this.maxRequests - record.count,
      resetSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }
}

// Global Limiter Instances
export const authRateLimiter = new SlidingWindowRateLimiter(60 * 1000, 10); // 10 auth requests per min
export const paymentRateLimiter = new SlidingWindowRateLimiter(60 * 1000, 15); // 15 payment attempts per min
export const uploadRateLimiter = new SlidingWindowRateLimiter(60 * 1000, 20); // 20 file uploads per min
export const generalApiRateLimiter = new SlidingWindowRateLimiter(60 * 1000, 120); // 120 requests per min

/**
 * Extracts client IP safely from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Enforces rate limiting on an incoming route.
 * Returns null if allowed, or a 429 NextResponse if rate limit is exceeded.
 */
export function enforceRateLimit(
  request: Request,
  limiter: SlidingWindowRateLimiter = generalApiRateLimiter,
  customKeyPrefix = "api"
): NextResponse | null {
  const clientIp = getClientIp(request);
  const key = `${customKeyPrefix}:${clientIp}`;
  const result = limiter.check(key);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many requests from your IP. Please wait ${result.resetSeconds} seconds before retrying.`,
        retryAfter: result.resetSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetSeconds),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
