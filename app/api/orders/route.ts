
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "ticketlagbe-secret-key-2026"
);

async function getUserId(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const token = cookieHeader
    .split(";")
    .find((cookie) =>
      cookie.trim().startsWith("ticketlagbe_token=")
    )
    ?.split("=")[1];

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    return payload.userId as string;
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET ORDERS
|--------------------------------------------------------------------------
| Logged-in buyer নিজের orders দেখতে পারবে।
*/

export async function GET(request: Request) {
  try {
    const buyerId = await getUserId(request);

    if (!buyerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        buyerId,
      },
      include: {
        ticket: true,
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
    const buyerId = await getUserId(request);

    if (!buyerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const ticketId = body.ticketId;
    const quantity = Number(body.quantity);
    const paymentMethod = body.paymentMethod || "Cash on Delivery";

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
          message: "Quantity must be a valid positive number.",
        },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      /*
      |--------------------------------------------------------------------------
      | Find ticket
      |--------------------------------------------------------------------------
      */

      const ticket = await tx.ticket.findUnique({
        where: {
          id: ticketId,
        },
      });

      if (!ticket) {
        throw new Error("TICKET_NOT_FOUND");
      }

      /*
      |--------------------------------------------------------------------------
      | Seller cannot buy own ticket
      |--------------------------------------------------------------------------
      */

      if (ticket.sellerId === buyerId) {
        throw new Error("OWN_TICKET");
      }

      /*
      |--------------------------------------------------------------------------
      | Check availability
      |--------------------------------------------------------------------------
      */

      if (ticket.status !== "AVAILABLE") {
        throw new Error("TICKET_UNAVAILABLE");
      }

      if (ticket.quantity < quantity) {
        throw new Error("INSUFFICIENT_QUANTITY");
      }

      /*
      |--------------------------------------------------------------------------
      | Reduce ticket quantity
      |--------------------------------------------------------------------------
      */

      const updatedTicket = await tx.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      /*
      |--------------------------------------------------------------------------
      | Calculate total
      |--------------------------------------------------------------------------
      */

      const totalAmount = ticket.price * quantity;

      /*
      |--------------------------------------------------------------------------
      | Create order
      |--------------------------------------------------------------------------
      */

      const newOrder = await tx.order.create({
        data: {
          buyerId,
          ticketId: ticket.id,
          quantity,
          totalAmount,
          status: "PENDING",
          paymentMethod,
        },
        include: {
          ticket: true,
        },
      });

      /*
      |--------------------------------------------------------------------------
      | If no tickets remain, mark SOLD
      |--------------------------------------------------------------------------
      */

      if (updatedTicket.quantity === 0) {
        await tx.ticket.update({
          where: {
            id: ticket.id,
          },
          data: {
            status: "SOLD",
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
            message: "You cannot buy your own ticket.",
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
            message: "Not enough tickets available.",
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

