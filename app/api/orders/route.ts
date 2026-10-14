import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET ORDERS
|--------------------------------------------------------------------------
| Return orders for current user (as buyer or seller)
*/
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // "sales" or "purchases"

    if (view === "sales") {
      const orders = await prisma.order.findMany({
        where: {
          ticket: {
            sellerId: session.userId,
          },
        },
        include: {
          ticket: true,
          buyer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          payment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        success: true,
        orders,
      });
    }

    // Default: buyer purchases
    const orders = await prisma.order.findMany({
      where: {
        buyerId: session.userId,
      },
      include: {
        ticket: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        orders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get orders error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load orders.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
*/
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first to place an order.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const ticketId = body.ticketId;
    const quantity = Number(body.quantity) || 1;
    const paymentMethod = body.paymentMethod || "CARD";

    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a valid positive integer.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. Fetch ticket with row lock intent
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
      }

      // 2. Prevent purchasing own ticket
      if (ticket.sellerId === session.userId) {
        throw new Error("OWN_TICKET");
      }

      // 3. Verify availability & stock
      if (ticket.ticketStatus !== "AVAILABLE") {
        throw new Error("TICKET_UNAVAILABLE");
      }

      if (ticket.quantity < quantity) {
        throw new Error("INSUFFICIENT_QUANTITY");
      }

      // 4. Decrement inventory
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      // 5. Total calculation with service fee (e.g. 5% platform escrow protection fee)
      const subtotal = (ticket.price || 0) * quantity;
      const serviceFee = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + serviceFee;

      const isAutoConfirm = Boolean(body.autoConfirm);
      const orderStatus = isAutoConfirm ? "CONFIRMED" : "PENDING";
      const paymentStatus = isAutoConfirm ? "PAID" : "PENDING";
      const gatewayReference = `TRX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // 6. Create Order and Payment atomically
      const newOrder = await tx.order.create({
        data: {
          buyerId: session.userId,
          ticketId: ticket.id,
          quantity,
          orderTotal: totalAmount,
          orderStatus,
          paymentMethod,
          payment: {
            create: {
              paymentMethod,
              amount: totalAmount,
              paymentStatus,
              gatewayReference,
            },
          },
        },
        include: {
          ticket: true,
          payment: true,
        },
      });

      // If auto-confirmed, record ledger transaction immediately
      if (isAutoConfirm && newOrder.payment) {
        await tx.transaction.create({
          data: {
            orderId: newOrder.id,
            paymentId: newOrder.payment.id,
            transactionType: "ESCROW_DEPOSIT",
            amount: totalAmount,
            transactionStatus: "SUCCESS",
          },
        });
      }

      // 7. Mark ticket as SOLD if quantity reaches 0
      if (updatedTicket.quantity <= 0) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            ticketStatus: "SOLD",
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully.",
        order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

    if (error instanceof Error) {
      if (error.message === "TICKET_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Ticket not found.",
          },
          { status: 404 }
        );
      }

      if (error.message === "OWN_TICKET") {
        return NextResponse.json(
          {
            success: false,
            message: "You cannot purchase your own ticket.",
          },
          { status: 403 }
        );
      }

      if (error.message === "TICKET_UNAVAILABLE") {
        return NextResponse.json(
          {
            success: false,
            message: "This ticket is no longer available.",
          },
          { status: 400 }
        );
      }

      if (error.message === "INSUFFICIENT_QUANTITY") {
        return NextResponse.json(
          {
            success: false,
            message: "Not enough ticket stock remaining.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to place order.",
      },
      { status: 500 }
    );
  }
}
