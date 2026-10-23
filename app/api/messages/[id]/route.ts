import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/messages/[id]
|--------------------------------------------------------------------------
| Fetch all messages in a specific conversation and mark as read
*/
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please sign in to view conversation." },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        buyer: {
          select: { id: true, fullName: true, email: true, phone: true, role: true },
        },
        seller: {
          select: { id: true, fullName: true, email: true, phone: true, role: true },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            from: true,
            to: true,
            price: true,
            travelDate: true,
            travelTime: true,
            seatNumber: true,
            ticketType: true,
            ticketStatus: true,
            operatorName: true,
            coachType: true,
            boardingPoint: true,
            droppingPoint: true,
            bogeyNumber: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found." },
        { status: 404 }
      );
    }

    // Authorization check: User must be buyer or seller in this conversation
    if (
      conversation.buyerId !== session.userId &&
      conversation.sellerId !== session.userId &&
      session.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to view this chat." },
        { status: 403 }
      );
    }

    // Mark messages sent by the other party as read
    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    const partner =
      conversation.buyerId === session.userId
        ? conversation.seller
        : conversation.buyer;

    return NextResponse.json(
      {
        success: true,
        conversation: {
          id: conversation.id,
          ticket: conversation.ticket,
          partner: {
            id: partner.id,
            name: partner.fullName || partner.email.split("@")[0],
            email: partner.email,
            phone: partner.phone,
            role: partner.role,
          },
          messages: conversation.messages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch conversation messages error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load messages." },
      { status: 500 }
    );
  }
}
