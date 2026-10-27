import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPaymentSandbox, paymentGateway } from "@/lib/payment/gateway";

/*
|--------------------------------------------------------------------------
| POST /api/payments/webhook
|--------------------------------------------------------------------------
| Asynchronous payment notifications from a payment provider. Every request
| must carry a valid HMAC-SHA256 signature of the raw body (header
| x-payment-signature), except in PAYMENT_SANDBOX mode.
*/
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-payment-signature") ||
      request.headers.get("x-signature") ||
      "";

    if (!isPaymentSandbox() && !paymentGateway.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    let payload: {
      event?: string;
      orderId?: string;
      gatewayReference?: string;
      amount?: number;
      status?: string;
    } = {};

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON webhook payload." },
        { status: 400 }
      );
    }

    const { event, orderId, gatewayReference } = payload;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required in webhook payload." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    if (event === "PAYMENT_COMPLETED" || payload.status === "PAID") {
      if (order.payment?.paymentStatus === "PAID") {
        return NextResponse.json({
          success: true,
          status: "ALREADY_PROCESSED",
          message: "Order already marked as PAID.",
        });
      }

      if (!["PENDING", "PAYMENT_SUBMITTED"].includes(order.orderStatus)) {
        return NextResponse.json(
          { success: false, message: `Order is ${order.orderStatus}; payment not applied.` },
          { status: 409 }
        );
      }

      // The provider must report the full amount for this order.
      if (typeof payload.amount !== "number" || Math.abs(payload.amount - order.orderTotal) > 0.01) {
        return NextResponse.json(
          { success: false, message: "Webhook amount does not match the order total." },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        const paymentRecord = order.payment
          ? await tx.payment.update({
              where: { id: order.payment.id },
              data: {
                paymentStatus: "PAID",
                gatewayReference: gatewayReference || order.payment.gatewayReference,
                reviewedAt: new Date(),
              },
            })
          : await tx.payment.create({
              data: {
                orderId: order.id,
                paymentMethod: "WEBHOOK_GATEWAY",
                amount: order.orderTotal,
                gatewayReference: gatewayReference || `WH-${Date.now()}`,
                paymentStatus: "PAID",
              },
            });

        await tx.order.update({
          where: { id: order.id },
          data: { orderStatus: "CONFIRMED" },
        });

        await tx.transaction.create({
          data: {
            orderId: order.id,
            paymentId: paymentRecord.id,
            transactionType: "ESCROW_DEPOSIT_WEBHOOK",
            amount: order.orderTotal,
            transactionStatus: "SUCCESS",
          },
        });

        await tx.notification.create({
          data: {
            userId: order.buyerId,
            type: "PAYMENT_SUCCESS",
            message: `Payment for order #${order.id.slice(-6)} confirmed. Your ticket is now available.`,
          },
        });
      });

      return NextResponse.json({
        success: true,
        status: "PROCESSED",
        message: "Payment successfully confirmed via webhook.",
      });
    }

    if (event === "PAYMENT_FAILED" || payload.status === "FAILED") {
      if (order.payment && order.payment.paymentStatus !== "PAID") {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { paymentStatus: "FAILED" },
        });
      }

      return NextResponse.json({
        success: true,
        status: "RECORDED_FAILURE",
        message: "Payment failure recorded.",
      });
    }

    return NextResponse.json({
      success: true,
      status: "IGNORED",
      message: `Event '${event}' did not require state modification.`,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    return NextResponse.json(
      { success: false, message: "Webhook handler internal failure." },
      { status: 500 }
    );
  }
}
