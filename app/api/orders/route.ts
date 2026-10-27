import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations, RESERVATION_MINUTES, TICKET_RELEASED_STATUSES } from "@/lib/orders";

const MAX_TICKETS_PER_ORDER = 4;
const SERVICE_FEE_RATE = 0.05;

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

    await releaseExpiredReservations();

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

    // The booking code is what the buyer is paying for: release it only once
    // payment is confirmed.
    const visibleOrders = orders.map((order) =>
      TICKET_RELEASED_STATUSES.includes(order.orderStatus) || !order.ticket
        ? order
        : { ...order, ticket: { ...order.ticket, ticketCode: null } }
    );

    return NextResponse.json(
      {
        success: true,
        orders: visibleOrders,
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

    if (quantity > MAX_TICKETS_PER_ORDER) {
      return NextResponse.json(
        {
          success: false,
          message: `You can buy at most ${MAX_TICKETS_PER_ORDER} tickets per order.`,
        },
        { status: 400 }
      );
    }

    await releaseExpiredReservations();

    const order = await prisma.$transaction(async (tx) => {
      // 1. Fetch ticket
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: {
          verifications: { take: 1, orderBy: { id: "desc" }, select: { verificationStatus: true } },
        },
      });

      if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
      }

      // 2. Prevent purchasing own ticket
      if (ticket.sellerId === session.userId) {
        throw new Error("OWN_TICKET");
      }

      // 3. Only verified, available listings with a price can be bought
      if (
        ticket.ticketStatus !== "AVAILABLE" ||
        ticket.verifications[0]?.verificationStatus !== "VERIFIED" ||
        !ticket.price ||
        // travelDate is stored as midnight of the travel day; allow the whole day
        (ticket.travelDate && ticket.travelDate.getTime() + 24 * 60 * 60 * 1000 < Date.now())
      ) {
        throw new Error("TICKET_UNAVAILABLE");
      }

      // One open order per buyer per listing
      const openOrder = await tx.order.findFirst({
        where: {
          buyerId: session.userId,
          ticketId: ticket.id,
          orderStatus: { in: ["PENDING", "PAYMENT_SUBMITTED"] },
        },
        select: { id: true },
      });
      if (openOrder) {
        throw new Error(`OPEN_ORDER:${openOrder.id}`);
      }

      // 4. Atomically reserve stock: the WHERE clause fails if another buyer
      // took the last tickets between our read and this write.
      const reserved = await tx.ticket.updateMany({
        where: { id: ticket.id, ticketStatus: "AVAILABLE", quantity: { gte: quantity } },
        data: { quantity: { decrement: quantity } },
      });

      if (reserved.count === 0) {
        throw new Error("INSUFFICIENT_QUANTITY");
      }

      const updatedTicket = await tx.ticket.findUniqueOrThrow({ where: { id: ticket.id } });

      // 5. Total calculation with 5% platform escrow protection fee
      const subtotal = ticket.price * quantity;
      const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
      const totalAmount = subtotal + serviceFee;

      // 6. Create Order and Payment. Payment is confirmed later through
      // /api/payments/verify and admin review, never by the client.
      const newOrder = await tx.order.create({
        data: {
          buyerId: session.userId,
          ticketId: ticket.id,
          quantity,
          orderTotal: totalAmount,
          orderStatus: "PENDING",
          paymentMethod,
          payment: {
            create: {
              paymentMethod,
              amount: totalAmount,
              paymentStatus: "PENDING",
            },
          },
        },
        include: {
          ticket: { omit: { ticketCode: true } },
          payment: true,
        },
      });

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
        message: `Order placed. Complete payment within ${RESERVATION_MINUTES} minutes to keep your tickets.`,
        order,
        reservationExpiresAt: new Date(order.createdAt.getTime() + RESERVATION_MINUTES * 60 * 1000),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);

    if (error instanceof Error) {
      if (error.message.startsWith("OPEN_ORDER:")) {
        return NextResponse.json(
          {
            success: false,
            message: "You already have an open order for this ticket. Finish or cancel it first.",
            orderId: error.message.split(":")[1],
          },
          { status: 409 }
        );
      }

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
