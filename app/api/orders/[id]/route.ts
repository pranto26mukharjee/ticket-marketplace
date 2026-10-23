
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "ticketlagbe-secret-key"
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
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
            price: true,
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

    // Only the buyer who created the order can view it.
    if (order.buyerId !== userId) {
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

