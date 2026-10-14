import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // 1. Fetch current user
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        profile: {
          select: {
            identityVerified: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Please login first.",
        },
        { status: 401 }
      );
      response.cookies.delete("ticketlagbe_token");
      return response;
    }

    // 2. Fetch seller listings
    const listings = await prisma.ticket.findMany({
      where: {
        sellerId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
        verifications: {
          take: 1,
          select: {
            verificationStatus: true,
            aiConfidenceScore: true,
          },
        },
      },
    });

    // 3. Fetch buyer purchases
    const purchases = await prisma.order.findMany({
      where: {
        buyerId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        ticket: {
          include: {
            category: true,
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
    });

    // 4. Fetch sales (orders on this user's tickets)
    const sales = await prisma.order.findMany({
      where: {
        ticket: {
          sellerId: session.userId,
        },
      },
      orderBy: {
        createdAt: "desc",
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
    });

    // 5. Calculate seller statistics
    const totalListings = listings.length;
    const activeListings = listings.filter((t) => t.ticketStatus === "AVAILABLE").length;
    const soldListings = listings.filter((t) => t.ticketStatus === "SOLD").length;
    const cancelledListings = listings.filter((t) => t.ticketStatus === "CANCELLED").length;

    const totalSales = sales
      .filter((s) => s.orderStatus === "CONFIRMED" || s.orderStatus === "COMPLETED")
      .reduce((sum, order) => sum + order.orderTotal, 0);

    const totalListingValue = listings
      .filter((t) => t.ticketStatus === "AVAILABLE")
      .reduce((sum, t) => sum + (t.price || 0) * t.quantity, 0);

    // 6. Calculate buyer statistics
    const totalOrders = purchases.length;
    const activeOrders = purchases.filter((p) => p.orderStatus === "PENDING" || p.orderStatus === "CONFIRMED").length;
    const completedOrders = purchases.filter((p) => p.orderStatus === "COMPLETED").length;
    const totalSpent = purchases
      .filter((p) => p.orderStatus !== "CANCELLED")
      .reduce((sum, p) => sum + p.orderTotal, 0);

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
      buyerStats: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalSpent,
      },
      listings,
      purchases,
      sales,
      recentListings: listings.slice(0, 5),
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard data.",
      },
      { status: 500 }
    );
  }
}
