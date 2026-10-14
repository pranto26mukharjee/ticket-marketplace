import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/admin/fraud
|--------------------------------------------------------------------------
| List security fraud flags, suspicious activities, and duplicate attempts.
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

    const alerts = await prisma.fraudAlert.findMany({
      orderBy: [{ alertStatus: "asc" }, { id: "desc" }],
      include: {
        relatedUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            accountStatus: true,
          },
        },
        relatedTicket: {
          select: {
            id: true,
            title: true,
            from: true,
            to: true,
            price: true,
          },
        },
        relatedOrder: {
          select: {
            id: true,
            orderTotal: true,
            orderStatus: true,
          },
        },
        resolvedBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, alerts }, { status: 200 });
  } catch (error) {
    console.error("Admin get fraud alerts error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load fraud alerts." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/admin/fraud
|--------------------------------------------------------------------------
| Resolve or dismiss fraud alerts.
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
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { success: false, message: "Alert ID and action are required." },
        { status: 400 }
      );
    }

    const alertStatus = action === "DISMISS" ? "DISMISSED" : "RESOLVED";

    const updated = await prisma.$transaction(async (tx) => {
      await tx.adminAction.create({
        data: {
          adminId: session.userId,
          actionType: `FRAUD_ALERT_${alertStatus}`,
          targetType: "FRAUD_ALERT",
          targetId: alertId,
        },
      });

      return await tx.fraudAlert.update({
        where: { id: alertId },
        data: {
          alertStatus,
          resolvedById: session.userId,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: `Fraud alert marked as ${alertStatus.toLowerCase()}.`,
        alert: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update fraud alert error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update fraud alert." },
      { status: 500 }
    );
  }
}
