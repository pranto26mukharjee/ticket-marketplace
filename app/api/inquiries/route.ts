import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| POST /api/inquiries
|--------------------------------------------------------------------------
| Secure inquiry channel between buyer and seller regarding tickets or orders.
*/
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first to send an inquiry." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ticketId, orderId, message, subject } = body;

    if (!message || message.trim().length < 5) {
      return NextResponse.json(
        { success: false, message: "Message must be at least 5 characters long." },
        { status: 400 }
      );
    }

    let targetUserId = "";
    let itemTitle = "Ticket";

    if (ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { seller: true },
      });

      if (!ticket) {
        return NextResponse.json(
          { success: false, message: "Ticket not found." },
          { status: 404 }
        );
      }

      targetUserId = ticket.sellerId;
      itemTitle = ticket.title || `${ticket.from} to ${ticket.to}`;
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          ticket: { include: { seller: true } },
          buyer: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, message: "Order not found." },
          { status: 404 }
        );
      }

      // If buyer is sending, target seller. If seller is sending, target buyer.
      targetUserId =
        order.buyerId === session.userId
          ? order.ticket?.sellerId || ""
          : order.buyerId;
      itemTitle = `Order #${order.id.slice(-6)}`;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: "Recipient could not be resolved." },
        { status: 400 }
      );
    }

    if (targetUserId === session.userId) {
      return NextResponse.json(
        { success: false, message: "You cannot send an inquiry to yourself." },
        { status: 400 }
      );
    }

    // Dispatch notification to recipient
    await prisma.$transaction([
      prisma.notification.create({
        data: {
          userId: targetUserId,
          type: "INQUIRY_RECEIVED",
          message: `Inquiry from ${session.email} regarding ${itemTitle}: "${message.trim()}"`,
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: session.userId,
          type: "INQUIRY_SENT",
          message: `Your message regarding ${itemTitle} was sent successfully.`,
          isRead: true,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been delivered to the recipient.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send inquiry error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send inquiry." },
      { status: 500 }
    );
  }
}
