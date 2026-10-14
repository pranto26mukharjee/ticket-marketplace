import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reviews?orderId=xxx  — Fetch reviews for an order
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const sellerId = searchParams.get("sellerId");

    if (sellerId) {
      // Get all reviews for a seller
      const reviews = await prisma.review.findMany({
        where: { revieweeId: sellerId },
        include: {
          reviewer: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { id: "desc" },
        take: 20,
      });

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return NextResponse.json({
        success: true,
        reviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
      });
    }

    if (orderId) {
      const review = await prisma.review.findFirst({
        where: { orderId },
        include: {
          reviewer: { select: { id: true, fullName: true } },
        },
      });
      return NextResponse.json({ success: true, review: review || null });
    }

    return NextResponse.json({ success: false, message: "orderId or sellerId required." }, { status: 400 });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch reviews." }, { status: 500 });
  }
}

// POST /api/reviews — Submit a review for a completed order
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Please login first." }, { status: 401 });
    }

    const { orderId, rating, comment } = await request.json();

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Order ID and a rating from 1 to 5 are required." },
        { status: 400 }
      );
    }

    // Validate the order belongs to this buyer and is completed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        ticket: { select: { sellerId: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    if (order.buyerId !== session.userId) {
      return NextResponse.json({ success: false, message: "You can only review your own orders." }, { status: 403 });
    }

    if (order.orderStatus !== "CONFIRMED" && order.orderStatus !== "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "You can only review completed or confirmed orders." },
        { status: 400 }
      );
    }

    if (!order.ticket) {
      return NextResponse.json({ success: false, message: "Associated ticket not found." }, { status: 400 });
    }

    // Check for existing review
    const existing = await prisma.review.findFirst({ where: { orderId, reviewerId: session.userId } });
    if (existing) {
      return NextResponse.json({ success: false, message: "You have already reviewed this order." }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        orderId,
        reviewerId: session.userId,
        revieweeId: order.ticket.sellerId,
        rating,
        comment: comment?.trim() || null,
      },
    });

    // Create seller notification
    await prisma.notification.create({
      data: {
        userId: order.ticket.sellerId,
        type: "REVIEW_RECEIVED",
        message: `You received a ${rating}⭐ review on one of your tickets.`,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit review." }, { status: 500 });
  }
}
