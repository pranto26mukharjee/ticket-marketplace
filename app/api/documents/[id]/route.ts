import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TICKET_RELEASED_STATUSES } from "@/lib/orders";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/*
|--------------------------------------------------------------------------
| GET /api/documents/[id]
|--------------------------------------------------------------------------
| Streams a ticket PDF to its owner, an admin, or a buyer whose order for
| that ticket has been paid.
*/
export async function GET(request: Request, context: RouteContext) {
  const session = await getAuthUser(request);
  if (!session) {
    return NextResponse.json({ success: false, message: "Please login first." }, { status: 401 });
  }

  const { id } = await context.params;

  const document = await prisma.ticketDocument.findUnique({
    where: { id },
    select: { id: true, ownerId: true, ticketId: true, fileName: true, mimeType: true, data: true },
  });

  if (!document) {
    return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });
  }

  let allowed = document.ownerId === session.userId || session.role === "ADMIN";

  if (!allowed && document.ticketId) {
    const paidOrder = await prisma.order.findFirst({
      where: {
        ticketId: document.ticketId,
        buyerId: session.userId,
        orderStatus: { in: TICKET_RELEASED_STATUSES },
      },
      select: { id: true },
    });
    allowed = Boolean(paidOrder);
  }

  if (!allowed) {
    return NextResponse.json({ success: false, message: "You do not have access to this document." }, { status: 403 });
  }

  if (session.role === "ADMIN" && document.ownerId !== session.userId) {
    await prisma.adminAction.create({
      data: {
        adminId: session.userId,
        actionType: "VIEW_TICKET_DOCUMENT",
        targetType: "DOCUMENT",
        targetId: document.id,
      },
    });
  }

  return new NextResponse(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${document.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
