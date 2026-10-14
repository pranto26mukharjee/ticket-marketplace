import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        profile: {
          select: {
            address: true,
            identityVerified: true,
            nidPassportNo: true,
          },
        },
      },
    });

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          message: "User session expired or not found.",
        },
        { status: 401 }
      );
      response.cookies.delete("ticketlagbe_token");
      return response;
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Auth verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired session.",
      },
      { status: 401 }
    );
  }
}