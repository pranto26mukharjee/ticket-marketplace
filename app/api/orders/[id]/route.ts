import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
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
        payment: true,
        disputes: {
          take: 1,
          orderBy: { id: "desc" },
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

    // Role-based visibility check: Buyer, Seller, or Admin can view
    const isBuyer = order.buyerId === session.userId;
    const isSeller = order.ticket?.sellerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view this order.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      userRoleInOrder: isAdmin ? "ADMIN" : isSeller ? "SELLER" : "BUYER",
    });
  } catch (error) {
    console.error("Get order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load order.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/orders/[id]
|--------------------------------------------------------------------------
| Allows order state transitions: CANCEL, REFUND_REQUEST, COMPLETE
*/
export async function PATCH(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const body = await request.json();
    const { action, reason } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        ticket: true,
        payment: true,
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

    const isBuyer = order.buyerId === session.userId;
    const isSeller = order.ticket?.sellerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to modify this order.",
        },
        { status: 403 }
      );
    }

    // 1. Action: CANCEL
    if (action === "CANCEL") {
      if (order.orderStatus === "CANCELLED") {
        return NextResponse.json(
          { success: false, message: "Order is already cancelled." },
          { status: 400 }
        );
      }

      if (order.orderStatus === "COMPLETED") {
        return NextResponse.json(
          { success: false, message: "Completed trips cannot be cancelled." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        // Restore ticket quantity
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

        // Update payment status if exists
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              paymentStatus: "REFUND_REQUESTED",
            },
          });
        }

        // Update order status
        return await tx.order.update({
          where: { id },
          data: {
            orderStatus: "CANCELLED",
          },
          include: {
            ticket: true,
            payment: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Order has been cancelled and ticket inventory restored.",
        order: updated,
      });
    }

    // 2. Action: REFUND_REQUEST
    if (action === "REFUND_REQUEST") {
      if (order.orderStatus === "REFUND_REQUESTED") {
        return NextResponse.json(
          { success: false, message: "A refund has already been requested for this order." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        // Record dispute
        await tx.dispute.create({
          data: {
            orderId: id,
            raisedById: session.userId,
            disputeStatus: "OPEN",
            resolutionNotes: reason?.trim() || "Buyer submitted escrow refund request.",
          },
        });

        // Update payment status
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              paymentStatus: "REFUND_REQUESTED",
            },
          });
        }

        return await tx.order.update({
          where: { id },
          data: {
            orderStatus: "REFUND_REQUESTED",
          },
          include: {
            ticket: true,
            payment: true,
            disputes: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Refund request submitted. Platform escrow review is now pending.",
        order: updated,
      });
    }

    // 3. Action: COMPLETE
    if (action === "COMPLETE") {
      const updated = await prisma.$transaction(async (tx) => {
        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              paymentStatus: "PAID",
            },
          });
        }

        return await tx.order.update({
          where: { id },
          data: {
            orderStatus: "COMPLETED",
          },
          include: {
            ticket: true,
            payment: true,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Order marked as successfully completed.",
        order: updated,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid action specified.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Modify order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process order action.",
      },
      { status: 500 }
    );
  }
}
