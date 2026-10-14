import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/favorites
|--------------------------------------------------------------------------
| Return all favorite tickets for the authenticated user
*/
export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to view favorites.",
        },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.userId,
      },
      include: {
        ticket: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      favorites,
    });
  } catch (error) {
    console.error("Get favorites error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load favorites.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/favorites
|--------------------------------------------------------------------------
| Toggle favorite for a ticket (adds if not present, removes if present)
*/
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to save favorites.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const ticketId = body.ticketId;

    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required.",
        },
        { status: 400 }
      );
    }

    // Check if favorite already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_ticketId: {
          userId: session.userId,
          ticketId,
        },
      },
    });

    if (existing) {
      // Toggle off: remove
      await prisma.favorite.delete({
        where: {
          id: existing.id,
        },
      });

      return NextResponse.json({
        success: true,
        isFavorited: false,
        message: "Ticket removed from favorites.",
      });
    }

    // Add favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.userId,
        ticketId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        isFavorited: true,
        message: "Ticket saved to favorites.",
        favorite,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Toggle favorite error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update favorites.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/favorites
|--------------------------------------------------------------------------
| Remove ticket from favorites
*/
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket ID is required.",
        },
        { status: 400 }
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.userId,
        ticketId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ticket removed from favorites.",
    });
  } catch (error) {
    console.error("Delete favorite error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to remove favorite.",
      },
      { status: 500 }
    );
  }
}
