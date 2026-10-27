import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEnabledPaymentMethods, paymentGateway, PaymentMethodType } from "@/lib/payment/gateway";

/*
|--------------------------------------------------------------------------
| POST /api/payments/session
|--------------------------------------------------------------------------
| Initiates a payment session for an existing order with bKash, Nagad, Card, or Rocket.
*/
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first to initiate payment.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentMethod = "BKASH" } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const validMethods = getEnabledPaymentMethods();
    const normalizedMethod = (paymentMethod?.toUpperCase() || "BKASH") as PaymentMethodType;

    if (!validMethods.includes(normalizedMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid payment method. Supported: ${validMethods.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // 1. Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        ticket: true,
        buyer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
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

    // 2. Ownership check
    if (order.buyerId !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to make payment for this order.",
        },
        { status: 403 }
      );
    }

    // 3. Status check
    if (order.payment?.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "This order is already paid.",
        },
        { status: 400 }
      );
    }

    if (order.orderStatus !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message:
            order.orderStatus === "CANCELLED"
              ? "This order was cancelled or its reservation expired."
              : "Payment for this order has already been submitted.",
        },
        { status: 400 }
      );
    }

    // 4. Generate gateway session
    const gatewaySession = await paymentGateway.createPaymentSession({
      orderId: order.id,
      amount: order.orderTotal,
      paymentMethod: normalizedMethod,
      buyerName: order.buyer?.fullName || "Valued Buyer",
      buyerEmail: order.buyer?.email || session.email,
      buyerPhone: order.buyer?.phone || null,
    });

    // 5. Update or create payment record in DB
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          paymentMethod: normalizedMethod,
          gatewayReference: gatewaySession.gatewayReference,
          paymentStatus: "PROCESSING",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: normalizedMethod,
          gatewayReference: gatewaySession.gatewayReference,
          amount: order.orderTotal,
          paymentStatus: "PROCESSING",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment session initialized.",
        session: {
          orderId: order.id,
          amount: order.orderTotal,
          paymentMethod: normalizedMethod,
          gatewayReference: gatewaySession.gatewayReference,
          instructions: gatewaySession.instructions,
          status: gatewaySession.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment session error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize payment gateway session.",
      },
      { status: 500 }
    );
  }
}
