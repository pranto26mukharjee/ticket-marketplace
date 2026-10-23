
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: id,
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
      ticket: ticket,
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

