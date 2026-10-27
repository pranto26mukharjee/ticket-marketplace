import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/admin/metrics
|--------------------------------------------------------------------------
| Returns high-level platform health, volume, escrow lock, and risk indicators.
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

    // 1. Calculate Gross Platform Volume and Escrow Held
    const paidOrders = await prisma.order.findMany({
      where: {
        payment: {
          paymentStatus: "PAID",
        },
      },
      select: {
        orderTotal: true,
        orderStatus: true,
      },
    });

    const totalPlatformVolume = paidOrders.reduce((acc, o) => acc + (o.orderTotal || 0), 0);
    const totalEscrowHeld = paidOrders
      .filter((o) => o.orderStatus === "CONFIRMED" || o.orderStatus === "REFUND_REQUESTED")
      .reduce((acc, o) => acc + (o.orderTotal || 0), 0);

    // 2. Aggregate counts
    const [
      totalUsers,
      totalVerifiedUsers,
      totalTickets,
      activeTickets,
      totalOrders,
      openDisputes,
      openFraudAlerts,
      pendingVerifications,
      pendingPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.userProfile.count({ where: { identityVerified: true } }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { ticketStatus: "AVAILABLE" } }),
      prisma.order.count(),
      prisma.dispute.count({ where: { disputeStatus: "OPEN" } }),
      prisma.fraudAlert.count({ where: { alertStatus: "OPEN" } }),
      prisma.ticket.count({ where: { ticketStatus: "PENDING_REVIEW" } }),
      prisma.order.count({ where: { orderStatus: "PAYMENT_SUBMITTED" } }),
    ]);

    // 3. Fetch Recent Transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 8,
      orderBy: { id: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderTotal: true,
            buyer: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // 4. Fetch Recent Admin Actions
    const recentAdminActions = await prisma.adminAction.findMany({
      take: 6,
      orderBy: { id: "desc" },
      include: {
        admin: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        metrics: {
          totalPlatformVolume,
          totalEscrowHeld,
          totalUsers,
          totalVerifiedUsers,
          totalTickets,
          activeTickets,
          totalOrders,
          openDisputes,
          openFraudAlerts,
          pendingVerifications,
          pendingPayments,
        },
        recentTransactions,
        recentAdminActions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve administrative metrics." },
      { status: 500 }
    );
  }
}
