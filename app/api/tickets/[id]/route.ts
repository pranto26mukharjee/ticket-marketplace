import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notifyAdmins } from "@/lib/orders";

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
            createdAt: true,
            profile: {
              select: {
                identityVerified: true,
              },
            },
            _count: { select: { reviewsReceived: true } },
          },
        },
        verifications: {
          take: 1,
          orderBy: { id: "desc" },
          select: {
            id: true,
            verificationStatus: true,
            aiConfidenceScore: true,
            verificationMethod: true,
            decision: true,
            extractedData: true,
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

    const session = await getAuthUser(request);
    const isOwnerOrAdmin = Boolean(
      session && (session.userId === ticket.sellerId || session.role === "ADMIN")
    );

    // Listings under review, rejected or suspended are visible only to their seller and admins
    if (!isOwnerOrAdmin && !["AVAILABLE", "SOLD"].includes(ticket.ticketStatus)) {
      return NextResponse.json(
        { success: false, message: "Ticket not found." },
        { status: 404 }
      );
    }

    const sellerRating = await prisma.review.aggregate({
      where: { revieweeId: ticket.sellerId },
      _avg: { rating: true },
    });

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        // The booking code is released to the buyer only after payment
        ticketCode: isOwnerOrAdmin ? ticket.ticketCode : null,
        verifications: ticket.verifications.map((v) => ({
          ...v,
          extractedData: isOwnerOrAdmin ? v.extractedData : null,
        })),
        seller: {
          ...ticket.seller,
          averageRating: sellerRating._avg.rating,
        },
      },
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
      // The verified PDF fixes how many tickets exist; sellers can only lower it.
      if (!isAdmin && numQty > ticket.quantity) {
        return NextResponse.json(
          { success: false, message: "You can reduce the quantity, but not add tickets beyond what was verified." },
          { status: 400 }
        );
      }
      updateData.quantity = numQty;
      if (numQty === 0 && ticket.ticketStatus === "AVAILABLE") {
        updateData.ticketStatus = "SOLD";
      }
    }

    if (ticketStatus !== undefined && ticketStatus !== ticket.ticketStatus) {
      // Moderation states are controlled by admins (/api/admin/tickets).
      const lockedStatuses = ["PENDING_REVIEW", "REJECTED", "SUSPENDED"];
      if (!isAdmin && lockedStatuses.includes(ticket.ticketStatus)) {
        return NextResponse.json(
          { success: false, message: `This listing is ${ticket.ticketStatus.replace("_", " ").toLowerCase()} and can't be changed until an admin reviews it.` },
          { status: 403 }
        );
      }

      const sellerStatuses = ["AVAILABLE", "PAUSED", "CANCELLED"];
      if (!sellerStatuses.includes(ticketStatus) && !isAdmin) {
        return NextResponse.json(
          { success: false, message: "Invalid listing status." },
          { status: 400 }
        );
      }

      if (ticketStatus === "AVAILABLE") {
        const latest = await prisma.ticketVerification.findFirst({
          where: { ticketId: id },
          orderBy: { id: "desc" },
          select: { verificationStatus: true },
        });
        if (latest?.verificationStatus !== "VERIFIED") {
          return NextResponse.json(
            { success: false, message: "Only verified listings can be published." },
            { status: 400 }
          );
        }
      }

      updateData.ticketStatus = ticketStatus;
    }

    // Seat or date changes invalidate the document check, so the listing goes
    // back to admin review. Not allowed at all once tickets have been sold.
    const parsedDate = body.travelDate !== undefined ? new Date(body.travelDate) : null;
    const dateChanged =
      parsedDate !== null &&
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.getTime() !== ticket.travelDate?.getTime();
    const seatChanged =
      updateData.seatNumber !== undefined && updateData.seatNumber !== ticket.seatNumber;

    if ((dateChanged || seatChanged) && confirmedOrdersCount > 0) {
      return NextResponse.json(
        { success: false, message: "Seat and date can't be changed after tickets have been sold." },
        { status: 400 }
      );
    }

    if (dateChanged) {
      updateData.travelDate = parsedDate;
    }

    const needsReview = !isAdmin && (dateChanged || seatChanged);
    if (needsReview) {
      updateData.ticketStatus = "PENDING_REVIEW";
    }

    const updatedTicket = await prisma.$transaction(async (tx) => {
      if (needsReview) {
        await tx.ticketVerification.create({
          data: {
            ticketId: id,
            requestedById: session.userId,
            verificationMethod: "MANUAL_REVIEW",
            verificationStatus: "UNDER_REVIEW",
            decision: "Seller changed the seat or date after verification; an admin must re-check the ticket PDF.",
          },
        });
        await notifyAdmins(tx, "VERIFICATION_REVIEW", `Listing '${ticket.title}' was edited (seat/date) and needs re-verification.`);
      }

      return tx.ticket.update({
        where: { id },
        data: updateData,
        omit: { ticketCode: !isOwner && !isAdmin },
        include: {
          category: true,
        },
      });
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
