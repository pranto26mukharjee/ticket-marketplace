import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentGateway } from "@/lib/payment/gateway";
import { releaseExpiredReservations, restockTicket } from "@/lib/orders";

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

    await releaseExpiredReservations();

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
          payment: {
            include: { reviewedBy: { select: { fullName: true, email: true } } },
          },
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
| APPROVE_PAYMENT / REJECT_PAYMENT  review a submitted mobile-wallet payment
| FORCE_REFUND                      refund the buyer from escrow
| FORCE_COMPLETE                    release escrow to the seller
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
    const { orderId, action } = body;
    const resolutionNotes = typeof body.resolutionNotes === "string" ? body.resolutionNotes.trim() : "";

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

    const orderRef = `#${order.id.slice(-6)}`;
    const amountLabel = `৳${order.orderTotal.toLocaleString()}`;

    // 1. Approve a submitted wallet payment after checking the merchant statement
    if (action === "APPROVE_PAYMENT") {
      if (order.orderStatus !== "PAYMENT_SUBMITTED" || !order.payment) {
        return NextResponse.json(
          { success: false, message: "Only orders with a submitted payment can be approved." },
          { status: 400 }
        );
      }

      const payment = order.payment;
      const updated = await prisma.$transaction(async (tx) => {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "APPROVE_MANUAL_PAYMENT",
            targetType: "ORDER",
            targetId: orderId,
            details: `TrxID ${payment.trxId || "-"} from ${payment.senderNumber || "-"}. ${resolutionNotes}`.trim(),
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "PAID",
            reviewedAt: new Date(),
            reviewedById: session.userId,
            reviewNote: resolutionNotes || null,
          },
        });

        await tx.transaction.create({
          data: {
            orderId,
            paymentId: payment.id,
            transactionType: "ESCROW_DEPOSIT",
            amount: order.orderTotal,
            transactionStatus: "SUCCESS",
          },
        });

        await tx.notification.create({
          data: {
            userId: order.buyerId,
            type: "PAYMENT_SUCCESS",
            message: `Payment of ${amountLabel} for order ${orderRef} is confirmed. Your ticket details are now available.`,
          },
        });

        if (order.ticket?.sellerId) {
          await tx.notification.create({
            data: {
              userId: order.ticket.sellerId,
              type: "ESCROW_HOLD",
              message: `Order ${orderRef} is paid. ${amountLabel} is held in escrow until the buyer confirms the trip.`,
            },
          });
        }

        return tx.order.update({
          where: { id: orderId },
          data: { orderStatus: "CONFIRMED" },
          include: { payment: true, ticket: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Payment approved and order confirmed.",
        order: updated,
      });
    }

    // 2. Reject a submitted payment (TrxID not found, wrong amount, etc.)
    if (action === "REJECT_PAYMENT") {
      if (order.orderStatus !== "PAYMENT_SUBMITTED" || !order.payment) {
        return NextResponse.json(
          { success: false, message: "Only orders with a submitted payment can be rejected." },
          { status: 400 }
        );
      }

      if (!resolutionNotes) {
        return NextResponse.json(
          { success: false, message: "Give the buyer a reason for rejecting the payment." },
          { status: 400 }
        );
      }

      const payment = order.payment;
      const updated = await prisma.$transaction(async (tx) => {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "REJECT_MANUAL_PAYMENT",
            targetType: "ORDER",
            targetId: orderId,
            details: `TrxID ${payment.trxId || "-"}: ${resolutionNotes}`,
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: "REJECTED",
            reviewedAt: new Date(),
            reviewedById: session.userId,
            reviewNote: resolutionNotes,
          },
        });

        await restockTicket(tx, order);

        await tx.notification.create({
          data: {
            userId: order.buyerId,
            type: "PAYMENT_REJECTED",
            message: `We could not verify your payment for order ${orderRef}: ${resolutionNotes}. The order was cancelled. If money was deducted, contact support with your TrxID.`,
          },
        });

        return tx.order.update({
          where: { id: orderId },
          data: { orderStatus: "CANCELLED" },
          include: { payment: true, ticket: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Payment rejected, order cancelled and stock released.",
        order: updated,
      });
    }

    // 3. Refund buyer from escrow
    if (action === "FORCE_REFUND") {
      if (
        !["CONFIRMED", "REFUND_REQUESTED"].includes(order.orderStatus) ||
        !order.payment ||
        !["PAID", "REFUND_REQUESTED"].includes(order.payment.paymentStatus)
      ) {
        return NextResponse.json(
          { success: false, message: "Only paid orders still in escrow can be refunded." },
          { status: 400 }
        );
      }

      const payment = order.payment;
      const refundResult = await paymentGateway.processRefund({
        gatewayReference: payment.gatewayReference || payment.trxId || `TRX-${order.id}`,
        amount: order.orderTotal,
        reason: resolutionNotes || "Admin enforced dispute refund",
      });

      const updated = await prisma.$transaction(async (tx) => {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "FORCE_REFUND_ORDER",
            targetType: "ORDER",
            targetId: orderId,
            details: `${refundResult.refundReference}. ${resolutionNotes}`.trim(),
          },
        });

        await tx.dispute.updateMany({
          where: { orderId, disputeStatus: "OPEN" },
          data: {
            disputeStatus: "RESOLVED_REFUND",
            resolutionNotes: resolutionNotes || "Administrator approved buyer refund.",
          },
        });

        await restockTicket(tx, order);

        await tx.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: "REFUNDED" },
        });

        await tx.transaction.create({
          data: {
            orderId: order.id,
            paymentId: payment.id,
            transactionType: "ADMIN_FORCED_REFUND",
            amount: order.orderTotal,
            transactionStatus: "SUCCESS",
          },
        });

        await tx.notification.create({
          data: {
            userId: order.buyerId,
            type: "REFUND_COMPLETED",
            message: `Your refund of ${amountLabel} for order ${orderRef} has been approved and sent to your original payment method.`,
          },
        });

        if (order.ticket?.sellerId) {
          await tx.notification.create({
            data: {
              userId: order.ticket.sellerId,
              type: "ORDER_REFUNDED",
              message: `Order ${orderRef} was refunded to the buyer after review.${resolutionNotes ? ` Note: ${resolutionNotes}` : ""}`,
            },
          });
        }

        return tx.order.update({
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

    // 4. Release escrow to seller (dispute decided in seller's favour)
    if (action === "FORCE_COMPLETE") {
      if (
        !["CONFIRMED", "REFUND_REQUESTED"].includes(order.orderStatus) ||
        !order.payment ||
        !["PAID", "REFUND_REQUESTED"].includes(order.payment.paymentStatus)
      ) {
        return NextResponse.json(
          { success: false, message: "Only paid orders still in escrow can be released." },
          { status: 400 }
        );
      }

      const payment = order.payment;
      const updated = await prisma.$transaction(async (tx) => {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "FORCE_RELEASE_ESCROW",
            targetType: "ORDER",
            targetId: orderId,
            details: resolutionNotes || null,
          },
        });

        await tx.dispute.updateMany({
          where: { orderId, disputeStatus: "OPEN" },
          data: {
            disputeStatus: "RESOLVED_SELLER_FAVOR",
            resolutionNotes: resolutionNotes || "Administrator released payout to seller.",
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: "PAID" },
        });

        await tx.transaction.create({
          data: {
            orderId,
            paymentId: payment.id,
            transactionType: "ESCROW_RELEASE",
            amount: order.orderTotal,
            transactionStatus: "SUCCESS",
          },
        });

        await tx.notification.create({
          data: {
            userId: order.buyerId,
            type: "DISPUTE_RESOLVED",
            message: `Order ${orderRef} was reviewed and payment was released to the seller.${resolutionNotes ? ` Note: ${resolutionNotes}` : ""}`,
          },
        });

        if (order.ticket?.sellerId) {
          await tx.notification.create({
            data: {
              userId: order.ticket.sellerId,
              type: "PAYOUT_RELEASED",
              message: `Your payout for order ${orderRef} has been released from escrow.`,
            },
          });
        }

        return tx.order.update({
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
