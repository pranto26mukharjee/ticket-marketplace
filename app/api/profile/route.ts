import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/profile
|--------------------------------------------------------------------------
| Returns comprehensive profile information for the authenticated user/seller.
*/
export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

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
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Compute seller metrics
    const [totalSalesCount, totalCompletedSales, totalRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          ticket: { sellerId: session.userId },
        },
      }),
      prisma.order.count({
        where: {
          ticket: { sellerId: session.userId },
          orderStatus: { in: ["CONFIRMED", "COMPLETED"] },
        },
      }),
      prisma.order.aggregate({
        where: {
          ticket: { sellerId: session.userId },
          orderStatus: { in: ["CONFIRMED", "COMPLETED"] },
        },
        _sum: {
          orderTotal: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        sellerStats: {
          totalSalesCount,
          totalCompletedSales,
          totalRevenue: totalRevenue._sum.orderTotal || 0,
          sellerRating: 4.9,
          isVerifiedSeller: user.profile?.identityVerified || false,
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load profile details.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/profile
|--------------------------------------------------------------------------
| Update user and seller profile details (Full name, Phone, Address, DOB, NID).
*/
export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, phone, address, dob, nidPassportNo } = body;

    // 1. Update basic user record
    const userUpdateData: Record<string, unknown> = {};
    if (fullName !== undefined && fullName.trim()) {
      userUpdateData.fullName = fullName.trim();
    }
    if (phone !== undefined) {
      userUpdateData.phone = phone ? phone.trim() : null;
    }

    // 2. Update or upsert user profile
    const profileUpdateData: Record<string, unknown> = {};
    if (fullName !== undefined && fullName.trim()) {
      profileUpdateData.fullName = fullName.trim();
    }
    if (address !== undefined) {
      profileUpdateData.address = address ? address.trim() : null;
    }
    if (nidPassportNo !== undefined) {
      profileUpdateData.nidPassportNo = nidPassportNo ? nidPassportNo.trim() : null;
    }
    if (dob !== undefined && dob) {
      const parsedDob = new Date(dob);
      if (!Number.isNaN(parsedDob.getTime())) {
        profileUpdateData.dob = parsedDob;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...userUpdateData,
        profile: {
          upsert: {
            create: {
              fullName: fullName || "User",
              address: address ? address.trim() : null,
              nidPassportNo: nidPassportNo ? nidPassportNo.trim() : null,
              dob: dob ? new Date(dob) : null,
              identityVerified: false,
            },
            update: profileUpdateData,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        profile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile.",
      },
      { status: 500 }
    );
  }
}
