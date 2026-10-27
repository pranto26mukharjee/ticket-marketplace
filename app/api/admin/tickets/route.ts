import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/*
|--------------------------------------------------------------------------
| GET /api/admin/tickets
|--------------------------------------------------------------------------
| List all marketplace tickets with AI verification scores and seller trust.
*/
export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { from: { contains: search, mode: "insensitive" } },
        { to: { contains: search, mode: "insensitive" } },
        { seller: { fullName: { contains: search, mode: "insensitive" } } },
        { seller: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "ALL") {
      whereClause.ticketStatus = status.toUpperCase();
    }

    const [totalTickets, tickets] = await Promise.all([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              accountStatus: true,
            },
          },
          verifications: {
            take: 1,
            orderBy: { id: "desc" },
            select: {
              id: true,
              aiConfidenceScore: true,
              decision: true,
              verificationStatus: true,
              documentUrl: true,
              verificationMethod: true,
              extractedData: true,
            },
          },
          fraudAlerts: {
            select: {
              id: true,
              alertType: true,
              severity: true,
              alertStatus: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        tickets,
        pagination: {
          totalTickets,
          page,
          totalPages: Math.ceil(totalTickets / limit) || 1,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin get tickets error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load tickets." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/admin/tickets
|--------------------------------------------------------------------------
| Moderate listing (SUSPEND, ACTIVATE, APPROVE_AI, REJECT_AI).
*/
export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ticketId, action } = body;

    if (!ticketId || !action) {
      return NextResponse.json(
        { success: false, message: "Ticket ID and action are required." },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { verifications: { orderBy: { id: "desc" }, take: 1 } },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found." },
        { status: 404 }
      );
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
    const notifySeller = (tx: Prisma.TransactionClient, type: string, message: string) =>
      tx.notification.create({ data: { userId: ticket.sellerId, type, message } });

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Suspend or activate
      if (action === "SUSPEND") {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "SUSPEND_TICKET",
            targetType: "TICKET",
            targetId: ticketId,
            details: note || null,
          },
        });

        await notifySeller(tx, "LISTING_SUSPENDED", `Your listing '${ticket.title}' was suspended by an administrator.${note ? ` Reason: ${note}` : ""}`);

        return await tx.ticket.update({
          where: { id: ticketId },
          data: { ticketStatus: "SUSPENDED" },
        });
      }

      if (action === "ACTIVATE") {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "ACTIVATE_TICKET",
            targetType: "TICKET",
            targetId: ticketId,
          },
        });

        return await tx.ticket.update({
          where: { id: ticketId },
          data: { ticketStatus: "AVAILABLE" },
        });
      }

      // 2. Override AI decision
      if (action === "APPROVE_AI") {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "OVERRIDE_APPROVE_AI",
            targetType: "TICKET",
            targetId: ticketId,
            details: note || null,
          },
        });

        if (ticket.verifications.length > 0) {
          await tx.ticketVerification.update({
            where: { id: ticket.verifications[0].id },
            data: {
              decision: `Approved by admin after manual review.${note ? ` ${note}` : ""}`,
              verificationStatus: "VERIFIED",
            },
          });
        }

        await notifySeller(tx, "LISTING_APPROVED", `Your listing '${ticket.title}' passed manual review and is now live.`);

        return await tx.ticket.update({
          where: { id: ticketId },
          data: { ticketStatus: "AVAILABLE" },
        });
      }

      if (action === "REJECT_AI") {
        await tx.adminAction.create({
          data: {
            adminId: session.userId,
            actionType: "OVERRIDE_REJECT_AI",
            targetType: "TICKET",
            targetId: ticketId,
            details: note || null,
          },
        });

        if (ticket.verifications.length > 0) {
          await tx.ticketVerification.update({
            where: { id: ticket.verifications[0].id },
            data: {
              decision: `Rejected by admin.${note ? ` Reason: ${note}` : ""}`,
              verificationStatus: "REJECTED",
            },
          });
        }

        await notifySeller(
          tx,
          "LISTING_REJECTED",
          `Your listing '${ticket.title}' was rejected after manual review.${note ? ` Reason: ${note}` : ""}`
        );

        return await tx.ticket.update({
          where: { id: ticketId },
          data: { ticketStatus: "REJECTED" },
        });
      }

      throw new Error("INVALID_ACTION");
    });

    return NextResponse.json(
      {
        success: true,
        message: `Ticket action '${action}' applied successfully.`,
        ticket: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin update ticket error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to apply moderation action." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/admin/tickets
|--------------------------------------------------------------------------
| Delete or remove listing from marketplace with admin audit log.
*/
export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Administrator access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { success: false, message: "Ticket ID is required." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.adminAction.create({
        data: {
          adminId: session.userId,
          actionType: "DELETE_TICKET",
          targetType: "TICKET",
          targetId: ticketId,
        },
      });

      // Mark cancelled rather than hard deleting to preserve historical orders
      await tx.ticket.update({
        where: { id: ticketId },
        data: { ticketStatus: "CANCELLED" },
      });
    });

    return NextResponse.json(
      { success: true, message: "Ticket listing removed by administrator." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin delete ticket error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete ticket." },
      { status: 500 }
    );
  }
}
