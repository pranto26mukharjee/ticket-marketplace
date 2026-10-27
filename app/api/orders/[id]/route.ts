import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins, restockTicket, TICKET_RELEASED_STATUSES } from "@/lib/orders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/*
|--------------------------------------------------------------------------
| GET /api/orders/[id]
|--------------------------------------------------------------------------
*/
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            from: true,
            to: true,
            travelDate: true,
            travelTime: true,
            seatNumber: true,
            ticketType: true,
            ticketCode: true,
            price: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
            document: { select: { id: true, fileName: true } },
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          omit: { reviewedById: true },
        },
        disputes: {
          take: 1,
          orderBy: { id: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // Role-based visibility check: Buyer, Seller, or Admin can view
    const isBuyer = order.buyerId === session.userId;
    const isSeller = order.ticket?.sellerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to view this order." },
        { status: 403 }
      );
    }

    const ticketReleased = TICKET_RELEASED_STATUSES.includes(order.orderStatus);
    const canSeeTicket = isSeller || isAdmin || ticketReleased;

    // Seller contact details are shared with the buyer only after payment
    const ticket = order.ticket && {
      ...order.ticket,
      ticketCode: canSeeTicket ? order.ticket.ticketCode : null,
      seller: ticketReleased || isSeller || isAdmin
        ? order.ticket.seller
        : { ...order.ticket.seller, email: null, phone: null },
      document: undefined,
    };

    return NextResponse.json({
      success: true,
      order: { ...order, ticket },
      ticketDocumentUrl:
        canSeeTicket && order.ticket?.document ? `/api/documents/${order.ticket.document.id}` : null,
      userRoleInOrder: isAdmin ? "ADMIN" : isSeller ? "SELLER" : "BUYER",
    });
  } catch (error) {
    console.error("Get order error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load order." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/orders/[id]
|--------------------------------------------------------------------------
| Buyer/seller order transitions:
|   CANCEL          buyer or seller, only before payment is submitted
|   REFUND_REQUEST  buyer, on a confirmed order (opens a dispute for admin)
|   COMPLETE        buyer confirms the ticket worked; releases escrow to seller
| Admins use /api/admin/orders for payment review, refunds and dispute rulings.
*/
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        ticket: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    const isBuyer = order.buyerId === session.userId;
    const isSeller = order.ticket?.sellerId === session.userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to modify this order." },
        { status: 403 }
      );
    }

    const orderRef = `#${order.id.slice(-6)}`;

    // 1. CANCEL: only before any money has been sent
    if (action === "CANCEL") {
      if (order.orderStatus !== "PENDING") {
        return NextResponse.json(
          {
            success: false,
            message:
              order.orderStatus === "CANCELLED"
                ? "Order is already cancelled."
                : "Payment has already been submitted for this order. Request a refund instead.",
          },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: { id, orderStatus: "PENDING" },
          data: { orderStatus: "CANCELLED" },
        });
        if (claimed.count === 0) throw new Error("ORDER_STATE_CHANGED");

        await restockTicket(tx, order);

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "CANCELLED" },
          });
        }

        const otherParty = isBuyer ? order.ticket?.sellerId : order.buyerId;
        if (otherParty) {
          await tx.notification.create({
            data: {
              userId: otherParty,
              type: "ORDER_CANCELLED",
              message: `Order ${orderRef} was cancelled by the ${isBuyer ? "buyer" : "seller"}.`,
            },
          });
        }

        return tx.order.findUnique({ where: { id }, include: { payment: true } });
      });

      return NextResponse.json({
        success: true,
        message: "Order has been cancelled and ticket inventory restored.",
        order: updated,
      });
    }

    // 2. REFUND_REQUEST: buyer disputes a paid order before escrow release
    if (action === "REFUND_REQUEST") {
      if (!isBuyer) {
        return NextResponse.json(
          { success: false, message: "Only the buyer can request a refund." },
          { status: 403 }
        );
      }

      if (order.orderStatus !== "CONFIRMED") {
        return NextResponse.json(
          {
            success: false,
            message:
              order.orderStatus === "REFUND_REQUESTED"
                ? "A refund has already been requested for this order."
                : "Refunds can only be requested for paid orders that are not yet completed.",
          },
          { status: 400 }
        );
      }

      if (reason.length < 10) {
        return NextResponse.json(
          { success: false, message: "Please describe the problem (at least 10 characters)." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.dispute.create({
          data: {
            orderId: id,
            raisedById: session.userId,
            disputeStatus: "OPEN",
            resolutionNotes: reason,
          },
        });

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "REFUND_REQUESTED" },
          });
        }

        if (order.ticket?.sellerId) {
          await tx.notification.create({
            data: {
              userId: order.ticket.sellerId,
              type: "DISPUTE_OPENED",
              message: `The buyer of order ${orderRef} opened a dispute. Escrow is frozen until an admin reviews it.`,
            },
          });
        }

        await notifyAdmins(tx, "DISPUTE_OPENED", `Dispute opened on order ${orderRef}: ${reason.slice(0, 120)}`);

        return tx.order.update({
          where: { id },
          data: { orderStatus: "REFUND_REQUESTED" },
          include: { payment: true, disputes: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Refund request submitted. Our team will review it and contact both parties.",
        order: updated,
      });
    }

    // 3. COMPLETE: buyer confirms the ticket was valid; escrow goes to seller
    if (action === "COMPLETE") {
      if (!isBuyer) {
        return NextResponse.json(
          { success: false, message: "Only the buyer can confirm the trip and release payment." },
          { status: 403 }
        );
      }

      if (order.orderStatus !== "CONFIRMED" || order.payment?.paymentStatus !== "PAID") {
        return NextResponse.json(
          { success: false, message: "Only paid, confirmed orders can be completed." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            orderId: id,
            paymentId: order.payment!.id,
            transactionType: "ESCROW_RELEASE",
            amount: order.orderTotal,
            transactionStatus: "SUCCESS",
          },
        });

        if (order.ticket?.sellerId) {
          await tx.notification.create({
            data: {
              userId: order.ticket.sellerId,
              type: "PAYOUT_RELEASED",
              message: `The buyer confirmed order ${orderRef}. Your payout has been released from escrow.`,
            },
          });
        }

        return tx.order.update({
          where: { id },
          data: { orderStatus: "COMPLETED" },
          include: { payment: true },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Thanks for confirming! Payment has been released to the seller.",
        order: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action specified." },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_STATE_CHANGED") {
      return NextResponse.json(
        { success: false, message: "This order changed while you were viewing it. Please refresh." },
        { status: 409 }
      );
    }

    console.error("Modify order error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to process order action." },
      { status: 500 }
    );
  }
}
