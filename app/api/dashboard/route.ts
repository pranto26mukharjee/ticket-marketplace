
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "ticketlagbe-secret-key"
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

export async function GET(request: Request) {
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

    // Get current user
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Get all tickets created by this user
    const listings = await prisma.ticket.findMany({
      where: {
        sellerId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalListings = listings.length;

    const activeListings = listings.filter(
      (ticket) => ticket.status === "AVAILABLE"
    ).length;

    const soldListings = listings.filter(
      (ticket) => ticket.status === "SOLD"
    ).length;

    const cancelledListings = listings.filter(
      (ticket) => ticket.status === "CANCELLED"
    ).length;

    // Calculate sold amount
    const totalSales = listings
      .filter((ticket) => ticket.status === "SOLD")
      .reduce(
        (total, ticket) =>
          total + ticket.price * ticket.quantity,
        0
      );

    // Calculate total listing value
    const totalListingValue = listings
      .filter((ticket) => ticket.status === "AVAILABLE")
      .reduce(
        (total, ticket) =>
          total + ticket.price * ticket.quantity,
        0
      );

    // Recent listings
    const recentListings = listings.slice(0, 5);

    return NextResponse.json({
      success: true,

      user,

      stats: {
        totalListings,
        activeListings,
        soldListings,
        cancelledListings,
        totalSales,
        totalListingValue,
      },

      listings,

      recentListings,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard.",
      },
      { status: 500 }
    );
  }
}

