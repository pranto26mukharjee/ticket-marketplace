import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { verifyTicketWithAI, checkDuplicateTicket } from "@/lib/ai/ticket-verification";

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

    const where: Record<string, unknown> = {
      ticketStatus: "AVAILABLE",
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
      documentUrl,
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
    if (ticketQuantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be greater than 0.",
        },
        { status: 400 }
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

    // 2. Run AI & Rule Verification (Rule 10)
    const aiVerification = await verifyTicketWithAI({
      title,
      category,
      from,
      to,
      travelDate: parsedTravelDate,
      travelTime: travelTime || null,
      seatNumber: seatNumber || null,
      price: ticketPrice,
      ticketCode: ticketCode || null,
      fileName: documentUrl || null,
    });

    // Determine initial ticket status: If AI explicitly rejects, flag as PENDING/UNDER_REVIEW instead of freely available
    const initialStatus = aiVerification.status === "REJECTED" ? "PAUSED" : "AVAILABLE";

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
        from: from.trim(),
        to: to.trim(),
        travelDate: parsedTravelDate,
        travelTime: travelTime ? travelTime.trim() : null,
        seatNumber: seatNumber ? seatNumber.trim() : null,
        ticketType: ticketType ? ticketType.trim() : null,
        price: ticketPrice,
        quantity: ticketQuantity,
        ticketCode: ticketCode ? ticketCode.trim() : null,
        ticketStatus: initialStatus,
        seller: {
          connect: {
            id: session.userId,
          },
        },
        verifications: {
          create: {
            requestedById: session.userId,
            verificationMethod: "AI_OCR_RULE_CHECK",
            verificationStatus: aiVerification.status,
            aiConfidenceScore: aiVerification.confidenceScore,
            decision: aiVerification.decision,
            documentUrl: documentUrl || null,
            extractedData: JSON.stringify(aiVerification.extractedData),
          },
        },
      },
      include: {
        category: true,
        verifications: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          aiVerification.status === "VERIFIED"
            ? "Ticket verified and listed successfully!"
            : "Ticket listing submitted. AI flagged items for administrative review.",
        ticket,
        verification: aiVerification,
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
