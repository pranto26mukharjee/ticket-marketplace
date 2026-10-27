import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { verifyTicket, checkDuplicateTicket } from "@/lib/ai/ticket-verification";
import { isTicketCategory, TICKET_CATEGORY_CONFIG } from "@/lib/ticket-categories";
import { FraudDetectionService } from "@/lib/security/fraud-detection";
import { notifyAdmins, releaseExpiredReservations } from "@/lib/orders";

// Document analysis can take up to a minute.
export const maxDuration = 120;

/*
|--------------------------------------------------------------------------
| GET /api/tickets
|--------------------------------------------------------------------------
| Returns available tickets with optional query filters & pagination.
*/
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim();
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const category = searchParams.get("category")?.trim();
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    await releaseExpiredReservations();

    const where: Record<string, unknown> = {
      ticketStatus: "AVAILABLE",
      // Hide listings whose journey/show has already happened
      // (travelDate is midnight of the travel day, so keep today's listings)
      AND: [{ OR: [{ travelDate: null }, { travelDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }] }],
    };

    if (category && category !== "ALL") {
      where.category = {
        categoryName: {
          equals: category,
          mode: "insensitive",
        },
      };
    }

    if (from) {
      where.from = {
        contains: from,
        mode: "insensitive",
      };
    }

    if (to) {
      where.to = {
        contains: to,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { from: { contains: search, mode: "insensitive" } },
        { to: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "cheapest") {
      orderBy = { price: "asc" };
    } else if (sort === "expensive") {
      orderBy = { price: "desc" };
    } else if (sort === "travel_date") {
      orderBy = { travelDate: "asc" };
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        omit: { ticketCode: true },
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              fullName: true,
            },
          },
          verifications: {
            take: 1,
            orderBy: { id: "desc" },
            select: {
              verificationStatus: true,
              aiConfidenceScore: true,
            },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      {
        success: true,
        tickets,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get tickets error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load tickets.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/tickets
|--------------------------------------------------------------------------
| Create a new ticket listing with AI verification and duplicate screening.
*/
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login first to create a ticket listing.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      category,
      description,
      from,
      to,
      travelDate,
      travelTime,
      seatNumber,
      ticketType,
      price,
      quantity,
      ticketCode,
      documentId,
      listingDetails,
    } = body;

    // Required field validation
    if (
      !title?.trim() ||
      !category?.trim() ||
      !from?.trim() ||
      !to?.trim() ||
      !travelDate ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields (title, category, origin, destination, date, price).",
        },
        { status: 400 }
      );
    }

    if (!isTicketCategory(category)) {
      return NextResponse.json(
        { success: false, message: "Select a supported ticket category." },
        { status: 400 }
      );
    }

    const categoryConfig = TICKET_CATEGORY_CONFIG[category];
    if (
      typeof ticketType !== "string" ||
      !(categoryConfig.ticketTypes as readonly string[]).includes(ticketType)
    ) {
      return NextResponse.json(
        { success: false, message: `Choose a valid ${categoryConfig.ticketTypeLabel.toLowerCase()} for ${categoryConfig.label} tickets.` },
        { status: 400 }
      );
    }

    const detailsInput =
      listingDetails && typeof listingDetails === "object" && !Array.isArray(listingDetails)
        ? listingDetails as Record<string, unknown>
        : {};
    const sanitizedListingDetails: Record<string, string> = {};

    for (const field of categoryConfig.detailFields) {
      const value = detailsInput[field.key];
      if (field.required && (typeof value !== "string" || !value.trim())) {
        return NextResponse.json(
          { success: false, message: `${field.label} is required for ${categoryConfig.label} tickets.` },
          { status: 400 }
        );
      }
      if (typeof value === "string" && value.trim()) {
        sanitizedListingDetails[field.key] = value.trim();
      }
    }

    const document =
      typeof documentId === "string"
        ? await prisma.ticketDocument.findFirst({
            where: { id: documentId, ownerId: session.userId, ticketId: null },
            select: { id: true, sha256: true, data: true },
          })
        : null;

    if (!document) {
      return NextResponse.json(
        { success: false, message: "Upload the ticket's original PDF before submitting it for verification." },
        { status: 400 }
      );
    }

    const ticketPrice = Number(price);
    if (Number.isNaN(ticketPrice) || ticketPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Price must be greater than 0.",
        },
        { status: 400 }
      );
    }

    const ticketQuantity = Number(quantity) || 1;
    if (!Number.isInteger(ticketQuantity) || ticketQuantity <= 0 || ticketQuantity > 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a whole number between 1 and 10.",
        },
        { status: 400 }
      );
    }

    if (!(await FraudDetectionService.checkListingVelocity(session.userId))) {
      return NextResponse.json(
        { success: false, message: "You are creating listings too quickly. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const parsedTravelDate = new Date(travelDate);
    if (Number.isNaN(parsedTravelDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid travel date format.",
        },
        { status: 400 }
      );
    }

    // 1. Run Duplicate Ticket Check (Rule 11)
    const duplicateCheck = await checkDuplicateTicket({
      from,
      to,
      travelDate: parsedTravelDate,
      seatNumber: seatNumber || null,
      ticketCode: ticketCode || null,
    });

    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate listing prevented: A ticket for this route, date, and seat is already registered in the marketplace.",
        },
        { status: 409 }
      );
    }

    // 2. Document analysis + cross-checks
    const aiVerification = await verifyTicket({
      category,
      title: title.trim(),
      from: from.trim(),
      to: to.trim(),
      travelDate: parsedTravelDate,
      travelTime: travelTime || null,
      seatNumber: seatNumber || null,
      ticketType,
      price: ticketPrice,
      quantity: ticketQuantity,
      ticketCode: ticketCode || null,
      listingDetails: sanitizedListingDetails,
      sellerId: session.userId,
      document,
    });

    // Only a clean pass goes live; everything else waits for an admin.
    const initialStatus =
      aiVerification.status === "VERIFIED"
        ? "AVAILABLE"
        : aiVerification.status === "UNDER_REVIEW"
          ? "PENDING_REVIEW"
          : "REJECTED";

    // The booking code is delivered to the buyer after payment, so keep the
    // one printed on the ticket if the seller left it blank.
    const finalTicketCode =
      (typeof ticketCode === "string" && ticketCode.trim()) ||
      aiVerification.extractedData.extraction?.bookingReference ||
      null;

    // 3. Create Ticket and Verification records in Database
    const ticket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        category: {
          connectOrCreate: {
            where: { categoryName: category.trim().toUpperCase() },
            create: { categoryName: category.trim().toUpperCase() },
          },
        },
        description: description ? description.trim() : null,
        listingDetails: sanitizedListingDetails,
        from: from.trim(),
        to: to.trim(),
        travelDate: parsedTravelDate,
        travelTime: travelTime ? travelTime.trim() : null,
        seatNumber: seatNumber ? seatNumber.trim() : null,
        ticketType: ticketType ? ticketType.trim() : null,
        price: ticketPrice,
        quantity: ticketQuantity,
        ticketCode: finalTicketCode,
        ticketStatus: initialStatus,
        seller: {
          connect: {
            id: session.userId,
          },
        },
        document: {
          connect: { id: document.id },
        },
        verifications: {
          create: {
            requestedById: session.userId,
            verificationMethod:
              aiVerification.extractedData.engine === "claude" ? "AI_DOCUMENT_ANALYSIS" : "RULES_ONLY",
            verificationStatus: aiVerification.status,
            aiConfidenceScore: aiVerification.confidenceScore,
            decision: aiVerification.decision,
            documentUrl: `/api/documents/${document.id}`,
            extractedData: JSON.stringify({
              ...aiVerification.extractedData,
              checks: aiVerification.checks,
            }),
          },
        },
      },
      include: {
        category: true,
        verifications: true,
      },
    });

    // Raise fraud alerts for the failures that indicate deliberate abuse
    const fraudChecks = aiVerification.checks.filter(
      (c) => c.status === "FAIL" && ["duplicate_file", "duplicate_listing", "tampering"].includes(c.key)
    );
    if (fraudChecks.length > 0) {
      await prisma.fraudAlert.createMany({
        data: fraudChecks.map((c) => ({
          relatedUserId: session.userId,
          relatedTicketId: ticket.id,
          alertType: c.key === "tampering" ? "TAMPERED_DOCUMENT" : "DUPLICATE_TICKET",
          severity: "HIGH",
          details: c.detail,
        })),
      });
    }

    if (initialStatus === "PENDING_REVIEW") {
      await prisma.$transaction((tx) =>
        notifyAdmins(tx, "VERIFICATION_REVIEW", `New listing '${ticket.title}' needs manual verification.`)
      );
    }

    const message =
      aiVerification.status === "VERIFIED"
        ? "Ticket verified and listed successfully!"
        : aiVerification.status === "UNDER_REVIEW"
          ? "Listing submitted. A few details need a manual check; it will go live once an admin approves it."
          : "Verification failed. Review the reasons below; you can fix the details and submit again.";

    return NextResponse.json(
      {
        success: true,
        message,
        ticket: { ...ticket, ticketCode: undefined },
        verification: {
          status: aiVerification.status,
          confidenceScore: aiVerification.confidenceScore,
          decision: aiVerification.decision,
          checks: aiVerification.checks,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create ticket error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create ticket listing.",
      },
      { status: 500 }
    );
  }
}
