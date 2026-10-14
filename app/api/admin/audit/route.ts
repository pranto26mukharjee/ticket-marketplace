import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/admin/audit
|--------------------------------------------------------------------------
| Returns immutable administrative audit trail and security event logs.
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "30")));
    const skip = (page - 1) * limit;

    const [totalAuditLogs, auditLogs, totalFraudEvents] = await Promise.all([
      prisma.adminAction.count(),
      prisma.adminAction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.fraudAlert.count(),
    ]);

    return NextResponse.json(
      {
        success: true,
        auditLogs,
        totalFraudEvents,
        pagination: {
          totalAuditLogs,
          page,
          totalPages: Math.ceil(totalAuditLogs / limit) || 1,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin audit log error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load audit logs." },
      { status: 500 }
    );
  }
}
