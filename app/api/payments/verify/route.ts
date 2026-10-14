import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentGateway, PaymentMethodType } from "@/lib/payment/gateway";
import { enforceRateLimit, paymentRateLimiter } from "@/lib/security/rate-limit";

/*
|--------------------------------------------------------------------------
| POST /api/payments/verify
|--------------------------------------------------------------------------
| Verifies a payment submission (OTP, PIN, 3D-Secure challenge) and secures
| funds inside the platform escrow state machine.
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
        {
          success: false,
          message: "Please login first to verify payment.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      gatewayReference,
      authCode,
      trxId,
      senderNumber,
      paymentMethod = "BKASH",
    } = body;

    const finalTrx = (trxId || authCode || "").trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // 1. Fetch order with payment and ticket details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        ticket: {
          select: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
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

    // 2. Ownership verification
    if (order.buyerId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to verify this payment.",
        },
        { status: 403 }
      );
    }

    // 3. Verify payment via Gateway abstraction
    const verification = await paymentGateway.verifyPayment({
      gatewayReference: gatewayReference || `REF-${order.id}`,
      authCode: finalTrx,
      trxId: finalTrx,
      senderNumber,
      paymentMethod: (paymentMethod?.toUpperCase() || "BKASH") as PaymentMethodType,
    });

    // 4. Handle Gateway Verification Failure (e.g. invalid PIN or simulation failure)
    if (!verification.success) {
      if (order.payment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: order.payment!.id },
            data: {
              paymentStatus: "FAILED",
            },
          });

          await tx.transaction.create({
            data: {
              orderId: order.id,
              paymentId: order.payment!.id,
              transactionType: "ESCROW_DEPOSIT_ATTEMPT",
              amount: order.orderTotal,
              transactionStatus: "FAILED",
            },
          });
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: verification.message || "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    // 5. Handle Gateway Success: Atomic State Transition to PAID & CONFIRMED
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Upsert payment
      let paymentRecord = order.payment;
      if (paymentRecord) {
        paymentRecord = await tx.payment.update({
          where: { id: paymentRecord.id },
          data: {
            paymentStatus: "PAID",
            gatewayReference: verification.transactionId,
            paymentMethod: paymentMethod.toUpperCase(),
          },
        });
      } else {
        paymentRecord = await tx.payment.create({
          data: {
            orderId: order.id,
            paymentMethod: paymentMethod.toUpperCase(),
            amount: order.orderTotal,
            gatewayReference: verification.transactionId,
            paymentStatus: "PAID",
          },
        });
      }

      // Update Order status
      const confirmedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "CONFIRMED",
        },
        include: {
          payment: true,
          ticket: true,
        },
      });

      // Record successful ledger transaction
      await tx.transaction.create({
        data: {
          orderId: order.id,
          paymentId: paymentRecord.id,
          transactionType: "ESCROW_DEPOSIT",
          amount: order.orderTotal,
          transactionStatus: "SUCCESS",
        },
      });

      // Notify Buyer
      await tx.notification.create({
        data: {
          userId: order.buyerId,
          type: "PAYMENT_SUCCESS",
          message: `Your payment of ৳${order.orderTotal.toLocaleString()} for order #${order.id.slice(-6)} was successful and is now held safely in TicketLagbe Escrow.`,
        },
      });

      // Notify Seller if present
      if (order.ticket?.sellerId) {
        await tx.notification.create({
          data: {
            userId: order.ticket.sellerId,
            type: "ESCROW_HOLD",
            message: `Buyer completed payment for '${order.ticket.title || "ticket"}'. ৳${order.orderTotal.toLocaleString()} is securely held in escrow until trip completion.`,
          },
        });
      }

      return confirmedOrder;
    });

    return NextResponse.json(
      {
        success: true,
        message: verification.message,
        transactionId: verification.transactionId,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment verify error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while verifying payment.",
      },
      { status: 500 }
    );
  }
}