
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "ticketlagbe-secret-key"
);

// Get logged-in user's ID from JWT cookie
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
| GET /api/tickets
|--------------------------------------------------------------------------
| Get all available tickets
*/
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        status: "AVAILABLE",
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        tickets: tickets,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get tickets error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load tickets.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/tickets
|--------------------------------------------------------------------------
| Create a new ticket listing
*/
export async function POST(request: Request) {
  try {
    // Check logged-in user
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
    }

    // Read request body
    const body = await request.json();

    const {
      title,
      category,
      description,
      from,
      to,
      travelDate,
      travelTime,
      seatNumber,
      ticketType,
      price,
      quantity,
    } = body;

    // Required field validation
    if (
      !title ||
      !category ||
      !from ||
      !to ||
      !travelDate ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 }
      );
    }

    // Validate price
    const ticketPrice = Number(price);

    if (Number.isNaN(ticketPrice) || ticketPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Price must be greater than 0.",
        },
        { status: 400 }
      );
    }

    // Validate quantity
    const ticketQuantity = Number(quantity) || 1;

    if (ticketQuantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be greater than 0.",
        },
        { status: 400 }
      );
    }

    // Validate travel date
    const parsedTravelDate = new Date(travelDate);

    if (Number.isNaN(parsedTravelDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid travel date.",
        },
        { status: 400 }
      );
    }

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),

        category: category,

        description: description
          ? description.trim()
          : null,

        from: from.trim(),

        to: to.trim(),

        travelDate: parsedTravelDate,

        travelTime: travelTime
          ? travelTime.trim()
          : null,

        seatNumber: seatNumber
          ? seatNumber.trim()
          : null,

        ticketType: ticketType
          ? ticketType.trim()
          : null,

        price: ticketPrice,

        quantity: ticketQuantity,

        status: "AVAILABLE",

        sellerId: userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Ticket listing created successfully.",

        ticket: ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create ticket listing.",
      },
      { status: 500 }
    );
  }
}

