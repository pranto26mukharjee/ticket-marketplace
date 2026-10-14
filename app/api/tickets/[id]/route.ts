import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/*
|--------------------------------------------------------------------------
| GET /api/tickets/[id]
|--------------------------------------------------------------------------
*/
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required.",
        },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
            profile: {
              select: {
                identityVerified: true,
              },
            },
          },
        },
        verifications: {
          take: 1,
          select: {
            id: true,
            verificationStatus: true,
            aiConfidenceScore: true,
            verificationMethod: true,
            decision: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Get ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load ticket.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/tickets/[id]
|--------------------------------------------------------------------------
| Allows seller (or admin) to edit ticket info, adjust price/quantity,
| or toggle status (AVAILABLE, PAUSED, CANCELLED).
*/
export async function PATCH(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found.",
        },
        { status: 404 }
      );
    }

    const isOwner = ticket.sellerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to edit this listing.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      quantity,
      seatNumber,
      travelTime,
      ticketStatus,
    } = body;

    // Check if ticket already has completed or confirmed orders
    const confirmedOrdersCount = await prisma.order.count({
      where: {
        ticketId: id,
        orderStatus: { in: ["CONFIRMED", "COMPLETED"] },
      },
    });

    const updateData: Record<string, unknown> = {};

    if (title !== undefined && title.trim()) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (seatNumber !== undefined) {
      updateData.seatNumber = seatNumber ? seatNumber.trim() : null;
    }

    if (travelTime !== undefined) {
      updateData.travelTime = travelTime ? travelTime.trim() : null;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (Number.isNaN(numPrice) || numPrice <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Price must be a valid number greater than 0.",
          },
          { status: 400 }
        );
      }
      updateData.price = numPrice;
    }

    if (quantity !== undefined) {
      const numQty = Number(quantity);
      if (!Number.isInteger(numQty) || numQty < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Quantity must be a non-negative integer.",
          },
          { status: 400 }
        );
      }
      updateData.quantity = numQty;
      if (numQty === 0 && (!ticketStatus || ticketStatus === "AVAILABLE")) {
        updateData.ticketStatus = "SOLD";
      }
    }

    if (ticketStatus !== undefined) {
      const validStatuses = ["AVAILABLE", "PAUSED", "CANCELLED", "SOLD"];
      if (validStatuses.includes(ticketStatus)) {
        updateData.ticketStatus = ticketStatus;
      }
    }

    // Safety rule: if there are already confirmed orders, don't allow modifying travel date
    if (body.travelDate !== undefined && confirmedOrdersCount === 0) {
      const parsedDate = new Date(body.travelDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        updateData.travelDate = parsedDate;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ticket listing updated successfully.",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Update ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update ticket listing.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/tickets/[id]
|--------------------------------------------------------------------------
| Permanently deletes an unsold listing, or cancels it if orders exist.
*/
export async function DELETE(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found.",
        },
        { status: 404 }
      );
    }

    const isOwner = ticket.sellerId === session.userId;
    const isAdmin = session.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to delete this ticket.",
        },
        { status: 403 }
      );
    }

    // If active or completed orders exist, do not physically delete from database (audit & accounting integrity)
    if (ticket.orders.length > 0) {
      await prisma.ticket.update({
        where: { id },
        data: {
          ticketStatus: "CANCELLED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Ticket has existing transaction history. It has been marked as CANCELLED.",
      });
    }

    // Delete associated verifications and favorites first, then ticket
    await prisma.$transaction([
      prisma.ticketVerification.deleteMany({ where: { ticketId: id } }),
      prisma.favorite.deleteMany({ where: { ticketId: id } }),
      prisma.ticket.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Ticket listing permanently deleted.",
    });
  } catch (error) {
    console.error("Delete ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete ticket listing.",
      },
      { status: 500 }
    );
  }
}
