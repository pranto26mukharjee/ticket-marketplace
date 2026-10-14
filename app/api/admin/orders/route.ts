import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentGateway } from "@/lib/payment/gateway";

/*
|--------------------------------------------------------------------------
| GET /api/admin/orders
|--------------------------------------------------------------------------
| Returns marketplace orders, escrow statuses, and associated disputes.
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
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      whereClause.orderStatus = status.toUpperCase();
    }

    const [totalOrders, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          ticket: {
            select: {
              id: true,
              title: true,
              from: true,
              to: true,
              travelDate: true,
              price: true,
              seller: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          payment: true,
          disputes: {
            take: 1,
            orderBy: { id: "desc" },
          },
          transactions: true,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        orders,
        pagination: {
          totalOrders,
          page,
          totalPages: Math.ceil(totalOrders / limit) || 1,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin get orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load orders." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/admin/orders
|--------------------------------------------------------------------------
| Force refund to buyer, force release payout to seller, or resolve dispute.
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
    const { orderId, action, resolutionNotes } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, message: "Order ID and action are required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        ticket: true,
        disputes: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // 1. Force Refund to Buyer
    if (action === "FORCE_REFUND") {
      const refundResult = await paymentGateway.processRefund({
        gatewayReference: order.payment?.gatewayReference || `TRX-${order.id}`,
        amount: order.orderTotal,
        reason: resolutionNotes || "Admin enforced dispute refund",
      });

      const updated = await prisma.$transaction(async (tx) => {
        // Log admin intervention
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "FORCE_REFUND_ORDER",
            targetType: "ORDER",
            targetId: orderId,
          },
        });

        // Close disputes
        await tx.dispute.updateMany({
          where: { orderId, disputeStatus: "OPEN" },
          data: {
            disputeStatus: "RESOLVED_REFUND",
            resolutionNotes: resolutionNotes || "Administrator approved buyer refund.",
          },
        });

        // Restock ticket
        if (order.ticketId && order.quantity) {
          await tx.ticket.update({
            where: { id: order.ticketId },
            data: {
              quantity: { increment: order.quantity },
              ticketStatus: "AVAILABLE",
            },
          });
        }

        // Update Payment status
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "REFUNDED" },
          });

          await tx.transaction.create({
            data: {
              orderId: order.id,
              paymentId: order.payment.id,
              transactionType: "ADMIN_FORCED_REFUND",
              amount: order.orderTotal,
              transactionStatus: "SUCCESS",
            },
          });
        }

        return await tx.order.update({
          where: { id: orderId },
          data: { orderStatus: "CANCELLED" },
          include: { payment: true, ticket: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Escrow funds refunded to buyer and inventory returned.",
        order: updated,
        refundReference: refundResult.refundReference,
      });
    }

    // 2. Force Release to Seller (Complete)
    if (action === "FORCE_COMPLETE") {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "FORCE_RELEASE_ESCROW",
            targetType: "ORDER",
            targetId: orderId,
          },
        });

        await tx.dispute.updateMany({
          where: { orderId, disputeStatus: "OPEN" },
          data: {
            disputeStatus: "RESOLVED_SELLER_FAVOR",
            resolutionNotes: resolutionNotes || "Administrator released payout to seller.",
          },
        });

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "PAID" },
          });
        }

        return await tx.order.update({
          where: { id: orderId },
          data: { orderStatus: "COMPLETED" },
          include: { payment: true, ticket: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Escrow payout confirmed and released to seller.",
        order: updated,
      });
    }

    // 3. Admin manually approves/verifies bKash payment
    if (action === "APPROVE_PAYMENT") {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "APPROVE_MANUAL_PAYMENT",
            targetType: "ORDER",
            targetId: orderId,
            details: resolutionNotes || "Admin verified bKash TrxID and approved payment.",
          },
        });

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "PAID" },
          });
        }

        return await tx.order.update({
          where: { id: orderId },
          data: { orderStatus: "CONFIRMED" },
          include: { payment: true, ticket: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Payment successfully approved and order confirmed.",
        order: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid order moderation action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin update order error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process order moderation." },
      { status: 500 }
    );
  }
}