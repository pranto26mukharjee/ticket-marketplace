import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentGateway } from "@/lib/payment/gateway";

/*
|--------------------------------------------------------------------------
| POST /api/payments/refund
|--------------------------------------------------------------------------
| Initiates an escrow refund to the buyer's original payment channel
| (bKash/Nagad/Card) and restores inventory stock.
*/
export async function POST(request: Request) {
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
    const { orderId, reason = "Customer requested refund" } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        ticket: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // Role check: Only buyer, seller, or admin can process/trigger refund
    const isBuyer = order.buyerId === session.userId;
    const isSeller = order.ticket?.sellerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to refund this order.",
        },
        { status: 403 }
      );
    }

    if (order.orderStatus === "CANCELLED" && order.payment?.paymentStatus === "REFUNDED") {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been refunded.",
        },
        { status: 400 }
      );
    }

    if (!order.payment) {
      return NextResponse.json(
        {
          success: false,
          message: "No payment record found for this order.",
        },
        { status: 400 }
      );
    }

    // Process refund through payment gateway
    const refundResult = await paymentGateway.processRefund({
      gatewayReference: order.payment.gatewayReference || `TRX-${order.id}`,
      amount: order.orderTotal,
      reason,
    });

    if (!refundResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: refundResult.message || "Gateway declined refund.",
        },
        { status: 400 }
      );
    }

    // Atomically update database: Payment -> REFUNDED, Order -> CANCELLED, restore ticket
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: {
          paymentStatus: "REFUNDED",
        },
      });

      // 2. Update Order status
      const cancelledOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "CANCELLED",
        },
        include: {
          payment: true,
          ticket: true,
        },
      });

      // 3. Restore ticket stock
      if (order.ticketId && order.quantity) {
        await tx.ticket.update({
          where: { id: order.ticketId },
          data: {
            quantity: {
              increment: order.quantity,
            },
            ticketStatus: "AVAILABLE",
          },
        });
      }

      // 4. Record ledger transaction
      await tx.transaction.create({
        data: {
          orderId: order.id,
          paymentId: order.payment!.id,
          transactionType: "ESCROW_REFUND",
          amount: order.orderTotal,
          transactionStatus: "SUCCESS",
        },
      });

      // 5. Create notifications
      await tx.notification.create({
        data: {
          userId: order.buyerId,
          type: "REFUND_COMPLETED",
          message: `Your refund of ৳${order.orderTotal.toLocaleString()} for order #${order.id.slice(-6)} has been processed to your original payment method.`,
        },
      });

      if (order.ticket?.sellerId) {
        await tx.notification.create({
          data: {
            userId: order.ticket.sellerId,
            type: "ORDER_REFUNDED",
            message: `Order #${order.id.slice(-6)} has been refunded and ticket inventory has been returned to available listings.`,
          },
        });
      }

      return cancelledOrder;
    });

    return NextResponse.json(
      {
        success: true,
        message: refundResult.message,
        refundReference: refundResult.refundReference,
        order: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Refund error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process refund.",
      },
      { status: 500 }
    );
  }
}
