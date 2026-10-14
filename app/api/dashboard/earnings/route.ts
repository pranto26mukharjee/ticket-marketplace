import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getAuthUser(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    // Get last 6 months of completed orders for this seller
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orders = await prisma.order.findMany({
      where: {
        ticket: { sellerId: session.userId },
        orderStatus: { in: ["CONFIRMED", "COMPLETED"] },
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        orderTotal: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by month
    const monthMap: Record<string, { revenue: number; orders: number }> = {};
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-BD", { month: "short", year: "2-digit" });
      monthMap[key] = { revenue: 0, orders: 0 };
      months.push(key);
    }

    orders.forEach((order) => {
      const key = new Date(order.createdAt).toLocaleDateString("en-BD", { month: "short", year: "2-digit" });
      if (monthMap[key]) {
        monthMap[key].revenue += order.orderTotal;
        monthMap[key].orders += 1;
      }
    });

    const labels = months;
    const revenue = months.map((m) => Math.round(monthMap[m].revenue));
    const orderCounts = months.map((m) => monthMap[m].orders);

    const totalRevenue = revenue.reduce((a, b) => a + b, 0);
    const totalOrders = orderCounts.reduce((a, b) => a + b, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Growth: compare last month vs month before
    const lastMonth = revenue[revenue.length - 1] || 0;
    const prevMonth = revenue[revenue.length - 2] || 0;
    const growthPercent = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

    return NextResponse.json({
      success: true,
      earnings: {
        labels,
        revenue,
        orders: orderCounts,
        totalRevenue,
        totalOrders,
        avgOrderValue,
        growthPercent: Math.round(growthPercent * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Earnings API error:", error);
    return NextResponse.json({ success: false, message: "Failed to load earnings." }, { status: 500 });
  }
}
