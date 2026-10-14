import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/auth";
import { enforceRateLimit, authRateLimiter, getClientIp } from "@/lib/security/rate-limit";
import { FraudDetectionService } from "@/lib/security/fraud-detection";

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimitResponse = enforceRateLimit(request, authRateLimiter, "login");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      // Record failed attempt for unknown email
      await FraudDetectionService.recordFailedLogin(email, getClientIp(request));

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Check account status
    if (user.accountStatus === "SUSPENDED" || user.accountStatus === "BANNED") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been suspended. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      // Track failed attempt
      await FraudDetectionService.recordFailedLogin(email, getClientIp(request));

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Create JWT
    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Save token in secure HTTP-only cookie
    response.cookies.set("ticketlagbe_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during login.",
      },
      { status: 500 }
    );
  }
}