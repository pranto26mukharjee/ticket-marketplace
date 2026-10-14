import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentGateway } from "@/lib/payment/gateway";

/*
|--------------------------------------------------------------------------
| POST /api/payments/webhook
|--------------------------------------------------------------------------
| Handles asynchronous IPN (Instant Payment Notification) and Webhooks
| from bKash, Nagad, SSLCommerz, and card acquirers with HMAC signature check.
*/
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature =
      request.headers.get("x-payment-signature") ||
      request.headers.get("x-signature") ||
      "";

    // 1. Cryptographic HMAC validation (Rule 18 & Phase 6 spec)
    // If webhook secret is configured or in strict mode, verify signature
    const isValidSignature = paymentGateway.verifyWebhookSignature(
      rawBody,
      signature
    );

    // In production without valid signature, reject webhook request
    if (process.env.NODE_ENV === "production" && !isValidSignature) {
      return NextResponse.json(
        { success: false, message: "Invalid webhook HMAC signature." },
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
      include: {
        payment: true,
        ticket: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // 2. Event Dispatching
    if (event === "PAYMENT_COMPLETED" || payload.status === "PAID") {
      // Idempotency: skip if already confirmed
      if (order.payment?.paymentStatus === "PAID") {
        return NextResponse.json({
          success: true,
          status: "ALREADY_PROCESSED",
          message: "Order already marked as PAID.",
        });
      }

      await prisma.$transaction(async (tx) => {
        let paymentRecord = order.payment;
        if (paymentRecord) {
          paymentRecord = await tx.payment.update({
            where: { id: paymentRecord.id },
            data: {
              paymentStatus: "PAID",
              gatewayReference: gatewayReference || paymentRecord.gatewayReference,
            },
          });
        } else {
          paymentRecord = await tx.payment.create({
            data: {
              orderId: order.id,
              paymentMethod: "WEBHOOK_GATEWAY",
              amount: order.orderTotal,
              gatewayReference: gatewayReference || `WH-${Date.now()}`,
              paymentStatus: "PAID",
            },
          });
        }

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
      });

      return NextResponse.json({
        success: true,
        status: "PROCESSED",
        message: "Payment successfully confirmed via webhook.",
      });
    }

    if (event === "PAYMENT_FAILED" || payload.status === "FAILED") {
      if (order.payment) {
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
