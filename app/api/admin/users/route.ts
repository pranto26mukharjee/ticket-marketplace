import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/admin/users
|--------------------------------------------------------------------------
| Paginated and searchable list of platform users with trust metrics.
*/
export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "ALL") {
      whereClause.role = role.toUpperCase();
    }

    if (status && status !== "ALL") {
      whereClause.accountStatus = status.toUpperCase();
    }

    const [totalUsers, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          accountStatus: true,
          createdAt: true,
          profile: {
            select: {
              identityVerified: true,
              nidPassportNo: true,
              address: true,
            },
          },
          _count: {
            select: {
              tickets: true,
              orders: true,
              reportsFiled: true,
              reportsAgainst: true,
              fraudAlerts: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        users,
        pagination: {
          totalUsers,
          page,
          totalPages: Math.ceil(totalUsers / limit) || 1,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load users." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/admin/users
|--------------------------------------------------------------------------
| Update user status (ACTIVE, SUSPENDED, BANNED), change role, or toggle KYC.
*/
export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, accountStatus, role, identityVerified } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    // Prevent admin from banning or demoting self
    if (user.id === session.userId && (accountStatus === "BANNED" || accountStatus === "SUSPENDED" || role === "BUYER")) {
      return NextResponse.json(
        { success: false, message: "You cannot suspend, ban, or demote your own administrator account." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Status modification
      if (action === "UPDATE_STATUS" && accountStatus) {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: `SET_STATUS_${accountStatus.toUpperCase()}`,
            targetType: "USER",
            targetId: userId,
          },
        });

        return await tx.user.update({
          where: { id: userId },
          data: { accountStatus: accountStatus.toUpperCase() },
          include: { profile: true },
        });
      }

      // 2. Role modification
      if (action === "UPDATE_ROLE" && role) {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: `SET_ROLE_${role.toUpperCase()}`,
            targetType: "USER",
            targetId: userId,
          },
        });

        return await tx.user.update({
          where: { id: userId },
          data: { role: role.toUpperCase() },
          include: { profile: true },
        });
      }

      // 3. KYC Verification Toggle
      if (action === "VERIFY_KYC") {
        const isVerified = Boolean(identityVerified);

        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: isVerified ? "APPROVE_KYC" : "REVOKE_KYC",
            targetType: "USER",
            targetId: userId,
          },
        });

        if (user.profile) {
          await tx.userProfile.update({
            where: { userId },
            data: { identityVerified: isVerified },
          });
        } else {
          await tx.userProfile.create({
            data: {
              userId,
              fullName: user.fullName || "User",
              identityVerified: isVerified,
            },
          });
        }

        return await tx.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });
      }

      throw new Error("INVALID_ACTION");
    });

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully.",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update user error:", error);

    if (error instanceof Error && error.message === "INVALID_ACTION") {
      return NextResponse.json(
        { success: false, message: "Invalid action or parameters provided." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update user." },
      { status: 500 }
    );
  }
}
