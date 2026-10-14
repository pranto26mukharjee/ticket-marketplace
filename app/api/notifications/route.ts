import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/notifications
|--------------------------------------------------------------------------
| Fetch notifications for the authenticated user with unread counter.
*/
export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20")));

    const whereClause: { userId: string; isRead?: boolean } = {
      userId: session.userId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const [unreadCount, notifications] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: session.userId,
          isRead: false,
        },
      }),
      prisma.notification.findMany({
        where: whereClause,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        unreadCount,
        notifications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load notifications." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH /api/notifications
|--------------------------------------------------------------------------
| Mark single notification as read or bulk mark all as read.
*/
export async function PATCH(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, markAll = false } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json(
        { success: true, message: "All notifications marked as read." },
        { status: 200 }
      );
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required." },
        { status: 400 }
      );
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.userId,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification marked as read.",
        updatedCount: updated.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update notification." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE /api/notifications
|--------------------------------------------------------------------------
| Delete single notification or clear all notifications for user.
*/
export async function DELETE(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      await prisma.notification.deleteMany({
        where: { userId: session.userId },
      });

      return NextResponse.json(
        { success: true, message: "All notifications cleared." },
        { status: 200 }
      );
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required." },
        { status: 400 }
      );
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: session.userId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Notification deleted." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete notification." },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/notifications
|--------------------------------------------------------------------------
| Send a system notification to a user.
*/
export async function POST(request: Request) {
  try {
    const session = await getAuthUser(request);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please login first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetUserId = session.userId, type = "SYSTEM_ALERT", message } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, message: "Notification message is required." },
        { status: 400 }
      );
    }

    const newNotification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        type,
        message: message.trim(),
        isRead: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification dispatched.",
        notification: newNotification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create notification." },
      { status: 500 }
    );
  }
}
