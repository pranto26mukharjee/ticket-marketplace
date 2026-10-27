import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEnabledPaymentMethods,
  normalizeBdMobile,
  paymentGateway,
  PaymentMethodType,
} from "@/lib/payment/gateway";
import { notifyAdmins } from "@/lib/orders";
import { enforceRateLimit, paymentRateLimiter } from "@/lib/security/rate-limit";

/*
|--------------------------------------------------------------------------
| POST /api/payments/verify
|--------------------------------------------------------------------------
| Buyer submits payment proof. Mobile-wallet payments (TrxID + sender number)
| go to UNDER_REVIEW and the order to PAYMENT_SUBMITTED until an admin
| confirms the money arrived. Sandbox card payments confirm instantly.
*/
export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, paymentRateLimiter, "pay-verify");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first to verify payment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, gatewayReference, authCode, trxId, senderNumber } = body;
    const paymentMethod = String(body.paymentMethod || "BKASH").toUpperCase() as PaymentMethodType;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    if (!getEnabledPaymentMethods().includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "This payment method is not available." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        ticket: { select: { id: true, title: true, sellerId: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // Only the buyer pays for their own order
    if (order.buyerId !== session.userId) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to pay for this order." },
        { status: 403 }
      );
    }

    if (order.orderStatus !== "PENDING") {
      const message =
        order.orderStatus === "PAYMENT_SUBMITTED"
          ? "Payment for this order has already been submitted and is under review."
          : order.orderStatus === "CANCELLED"
            ? "This order was cancelled or its reservation expired. Please place a new order."
            : "This order has already been paid.";
      return NextResponse.json({ success: false, message }, { status: 409 });
    }

    const verification = await paymentGateway.verifyPayment({
      gatewayReference: gatewayReference || order.payment?.gatewayReference || `REF-${order.id}`,
      authCode,
      trxId,
      senderNumber,
      paymentMethod,
    });

    if (!verification.success) {
      if (order.payment) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "FAILED" },
          }),
          prisma.transaction.create({
            data: {
              orderId: order.id,
              paymentId: order.payment.id,
              transactionType: "ESCROW_DEPOSIT_ATTEMPT",
              amount: order.orderTotal,
              transactionStatus: "FAILED",
            },
          }),
        ]);
      }

      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    const isInstant = verification.status === "PAID";
    const amountLabel = `৳${order.orderTotal.toLocaleString()}`;
    const orderRef = `#${order.id.slice(-6)}`;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Guard against double submission racing past the status check above.
      const claimed = await tx.order.updateMany({
        where: { id: order.id, orderStatus: "PENDING" },
        data: { orderStatus: isInstant ? "CONFIRMED" : "PAYMENT_SUBMITTED" },
      });
      if (claimed.count === 0) throw new Error("ORDER_STATE_CHANGED");

      const paymentData = {
        paymentMethod,
        paymentStatus: verification.status,
        trxId: isInstant ? null : verification.transactionId,
        senderNumber: isInstant ? null : normalizeBdMobile(senderNumber),
        submittedAt: new Date(),
        gatewayReference: isInstant ? verification.transactionId : order.payment?.gatewayReference,
      };

      const paymentRecord = order.payment
        ? await tx.payment.update({ where: { id: order.payment.id }, data: paymentData })
        : await tx.payment.create({
            data: { ...paymentData, orderId: order.id, amount: order.orderTotal },
          });

      if (isInstant) {
        await tx.transaction.create({
          data: {
            orderId: order.id,
            paymentId: paymentRecord.id,
            transactionType: "ESCROW_DEPOSIT",
            amount: order.orderTotal,
            transactionStatus: "SUCCESS",
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: order.buyerId,
          type: isInstant ? "PAYMENT_SUCCESS" : "PAYMENT_SUBMITTED",
          message: isInstant
            ? `Your payment of ${amountLabel} for order ${orderRef} was successful and is held in TicketLagbe Escrow.`
            : `We received your ${paymentMethod} payment details for order ${orderRef} (TrxID ${verification.transactionId}). You'll be notified once it is confirmed.`,
        },
      });

      if (isInstant && order.ticket?.sellerId) {
        await tx.notification.create({
          data: {
            userId: order.ticket.sellerId,
            type: "ESCROW_HOLD",
            message: `Buyer completed payment for '${order.ticket.title || "ticket"}'. ${amountLabel} is held in escrow until the trip is completed.`,
          },
        });
      }

      if (!isInstant) {
        await notifyAdmins(
          tx,
          "PAYMENT_REVIEW",
          `Order ${orderRef}: ${paymentMethod} payment of ${amountLabel} awaiting verification (TrxID ${verification.transactionId}).`
        );
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: { payment: true },
      });
    });

    return NextResponse.json(
      {
        success: true,
        status: verification.status,
        message: verification.message,
        transactionId: verification.transactionId,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "This Transaction ID has already been used for another order." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "ORDER_STATE_CHANGED") {
      return NextResponse.json(
        { success: false, message: "This order's payment was already submitted." },
        { status: 409 }
      );
    }

    console.error("Payment verify error:", error);

    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while verifying payment." },
      { status: 500 }
    );
  }
}
