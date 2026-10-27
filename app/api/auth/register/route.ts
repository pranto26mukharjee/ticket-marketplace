import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/auth";
import { enforceRateLimit, authRateLimiter } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, authRateLimiter, "register");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim() || null;
    const password = body.password;
    const requestedRole = body.role?.toUpperCase();
    const role = requestedRole === "SELLER" ? "SELLER" : "BUYER";

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Check duplicate phone (only if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this phone number already exists.",
          },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role,
        accountStatus: "ACTIVE",
        profile: {
          create: {
            fullName,
            identityVerified: false,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Auto login on signup: create JWT and set cookie
    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful.",
        user,
      },
      { status: 201 }
    );

    response.cookies.set("ticketlagbe_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);

    // Handle Prisma unique constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email or phone already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong during registration.",
      },
      { status: 500 }
    );
  }
}
