import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Safe table bootstrap in case new migration hasn't deployed to cloud database yet
let tableBootstrapped = false;
async function ensureChatTables() {
  if (tableBootstrapped) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Conversation" (
        "id" TEXT PRIMARY KEY,
        "ticketId" TEXT,
        "buyerId" TEXT NOT NULL,
        "sellerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS "ChatMessage" (
        "id" TEXT PRIMARY KEY,
        "conversationId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_ticketId_buyerId_sellerId_key" 
        ON "Conversation"("ticketId", "buyerId", "sellerId");
      CREATE INDEX IF NOT EXISTS "Conversation_buyerId_idx" ON "Conversation"("buyerId");
      CREATE INDEX IF NOT EXISTS "Conversation_sellerId_idx" ON "Conversation"("sellerId");
      CREATE INDEX IF NOT EXISTS "ChatMessage_conversationId_idx" ON "ChatMessage"("conversationId");
      CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");
    `);
    tableBootstrapped = true;
  } catch (err) {
    // If raw query fails (e.g. permission or already exists), proceed gracefully
    console.warn("Table bootstrap notice:", err);
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/messages
|--------------------------------------------------------------------------
| Fetch all active conversations for the authenticated user
*/
export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please sign in to access messages." },
        { status: 401 }
      );
    }

    await ensureChatTables();

    // Query conversations where user is buyer or seller
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: session.userId }, { sellerId: session.userId }],
      },
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
            bogeyNumber: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Compute unread count for each conversation
    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const partner = conv.buyerId === session.userId ? conv.seller : conv.buyer;
        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: session.userId },
            isRead: false,
          },
        });

        return {
          id: conv.id,
          ticket: conv.ticket,
          partner: {
            id: partner.id,
            name: partner.fullName || partner.email.split("@")[0],
            email: partner.email,
            phone: partner.phone,
            role: partner.role,
          },
          lastMessage: conv.messages[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json({ success: true, conversations: formatted }, { status: 200 });
  } catch (error) {
    console.error("Fetch conversations error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load conversations." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/messages
|--------------------------------------------------------------------------
| Send a message and create or locate the conversation
*/
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please sign in to send messages." },
        { status: 401 }
      );
    }

    await ensureChatTables();

    const body = await request.json();
    const { ticketId, recipientId, content, conversationId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    let activeConversationId = conversationId;

    // If conversationId is not provided, locate or create based on ticket / buyer / seller
    if (!activeConversationId) {
      let resolvedSellerId = recipientId;
      let resolvedTicketId = ticketId;

      if (ticketId) {
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketId },
        });
        if (!ticket) {
          return NextResponse.json(
            { success: false, message: "Ticket not found." },
            { status: 404 }
          );
        }
        resolvedSellerId = ticket.sellerId;
      }

      if (!resolvedSellerId) {
        return NextResponse.json(
          { success: false, message: "Recipient user not specified." },
          { status: 400 }
        );
      }

      if (resolvedSellerId === session.userId) {
        return NextResponse.json(
          { success: false, message: "You cannot message yourself." },
          { status: 400 }
        );
      }

      // Check existing conversation
      let conv = await prisma.conversation.findFirst({
        where: {
          OR: [
            { ticketId: resolvedTicketId, buyerId: session.userId, sellerId: resolvedSellerId },
            { ticketId: resolvedTicketId, buyerId: resolvedSellerId, sellerId: session.userId },
            { buyerId: session.userId, sellerId: resolvedSellerId },
            { buyerId: resolvedSellerId, sellerId: session.userId },
          ],
        },
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            ticketId: resolvedTicketId || null,
            buyerId: session.userId,
            sellerId: resolvedSellerId,
          },
        });
      }

      activeConversationId = conv.id;
    }

    // Create the chat message
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversationId,
        senderId: session.userId,
        content: content.trim(),
        isRead: false,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() },
    });

    // Fetch conversation to notify the other party
    const fullConv = await prisma.conversation.findUnique({
      where: { id: activeConversationId },
      include: {
        ticket: { select: { title: true, from: true, to: true } },
      },
    });

    if (fullConv) {
      const recipientUserId =
        fullConv.buyerId === session.userId ? fullConv.sellerId : fullConv.buyerId;

      const itemRef = fullConv.ticket?.title || 
        (fullConv.ticket?.from ? `${fullConv.ticket.from} ➔ ${fullConv.ticket.to}` : "Ticket");

      // Dispatch real-time in-app notification
      await prisma.notification.create({
        data: {
          userId: recipientUserId,
          type: "NEW_MESSAGE",
          message: `New message from ${session.email} regarding ${itemRef}: "${content.trim().slice(0, 60)}"`,
          isRead: false,
        },
      }).catch((err) => console.warn("Notification dispatch notice:", err));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully.",
        chatMessage: message,
        conversationId: activeConversationId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message." },
      { status: 500 }
    );
  }
}
