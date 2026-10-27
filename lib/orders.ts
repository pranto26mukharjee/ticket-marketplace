import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient;

// How long an unpaid order holds ticket stock before it is released.
export const RESERVATION_MINUTES = 30;

// Order lifecycle:
//   PENDING -> PAYMENT_SUBMITTED -> CONFIRMED -> COMPLETED
//   PENDING/PAYMENT_SUBMITTED -> CANCELLED (expired, cancelled, payment rejected)
//   CONFIRMED -> REFUND_REQUESTED -> CANCELLED (refunded) | COMPLETED (dispute lost)
export const ORDER_STATUSES = [
  "PENDING",
  "PAYMENT_SUBMITTED",
  "CONFIRMED",
  "COMPLETED",
  "REFUND_REQUESTED",
  "CANCELLED",
] as const;

/** Orders whose buyer may see the ticket code and download the original PDF. */
export const TICKET_RELEASED_STATUSES = ["CONFIRMED", "COMPLETED", "REFUND_REQUESTED"];

export async function restockTicket(
  tx: Tx,
  order: { ticketId: string | null; quantity: number | null }
) {
  if (!order.ticketId || !order.quantity) return;

  const ticket = await tx.ticket.update({
    where: { id: order.ticketId },
    data: { quantity: { increment: order.quantity } },
  });

  // Only a sell-out puts a listing back on the market; paused, suspended or
  // rejected listings stay as they are.
  if (ticket.ticketStatus === "SOLD" && ticket.quantity > 0) {
    await tx.ticket.update({
      where: { id: ticket.id },
      data: { ticketStatus: "AVAILABLE" },
    });
  }
}

export async function notifyAdmins(tx: Tx, type: string, message: string) {
  const admins = await tx.user.findMany({
    where: { role: "ADMIN", accountStatus: "ACTIVE" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await tx.notification.createMany({
    data: admins.map((admin) => ({ userId: admin.id, type, message })),
  });
}

/**
 * Cancels unpaid orders older than the reservation window and returns their
 * stock. Orders whose payment is already submitted for review are kept.
 * Called opportunistically from read paths, so no cron job is required.
 */
export async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_MINUTES * 60 * 1000);

  try {
    const expired = await prisma.order.findMany({
      where: { orderStatus: "PENDING", createdAt: { lt: cutoff } },
      select: { id: true, ticketId: true, quantity: true, buyerId: true, payment: { select: { id: true } } },
      take: 50,
    });

    for (const order of expired) {
      await prisma.$transaction(async (tx) => {
        // Re-check inside the transaction so a concurrent payment submission wins.
        const claimed = await tx.order.updateMany({
          where: { id: order.id, orderStatus: "PENDING" },
          data: { orderStatus: "CANCELLED" },
        });
        if (claimed.count === 0) return;

        if (order.payment) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: { paymentStatus: "CANCELLED" },
          });
        }

        await restockTicket(tx, order);

        await tx.notification.create({
          data: {
            userId: order.buyerId,
            type: "ORDER_EXPIRED",
            message: `Order #${order.id.slice(-6)} was cancelled because payment was not submitted within ${RESERVATION_MINUTES} minutes.`,
          },
        });
      });
    }
  } catch (error) {
    console.error("releaseExpiredReservations error:", error);
  }
}
