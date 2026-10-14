import { prisma } from "@/lib/prisma";

// In-memory failed attempt tracking: key -> { count, firstAttempt }
const failedLogins = new Map<string, { count: number; firstAttempt: number }>();

export class FraudDetectionService {
  /**
   * Tracks repeated failed authentication attempts and creates security alerts.
   */
  static async recordFailedLogin(email: string, ip: string) {
    const key = `${email}:${ip}`;
    const now = Date.now();
    const entry = failedLogins.get(key);

    if (!entry || now - entry.firstAttempt > 300000) {
      // New window (5 minutes)
      failedLogins.set(key, { count: 1, firstAttempt: now });
      return;
    }

    entry.count += 1;

    // Trigger fraud alert on 5+ failed attempts
    if (entry.count >= 5) {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        await prisma.fraudAlert.create({
          data: {
            relatedUserId: user?.id || null,
            alertType: "FAILED_LOGIN_SPIKE",
            severity: "HIGH",
            alertStatus: "OPEN",
            details: `Detected ${entry.count} consecutive failed login attempts within 5 minutes from IP ${ip}.`,
          },
        });
      } catch (err) {
        console.error("Failed to log fraud alert for failed logins:", err);
      }
    }
  }

  /**
   * Checks if a user is creating listings too quickly (listing spam/bot).
   */
  static async checkListingVelocity(userId: string): Promise<boolean> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const recentCount = await prisma.ticket.count({
      where: {
        sellerId: userId,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentCount >= 6) {
      await prisma.fraudAlert.create({
        data: {
          relatedUserId: userId,
          alertType: "RAPID_LISTING_SPAM",
          severity: "MEDIUM",
          alertStatus: "OPEN",
          details: `User created ${recentCount} listings in less than 10 minutes. Suspended auto-approval.`,
        },
      });
      return false; // velocity limit exceeded
    }

    return true;
  }

  /**
   * Records an immutable entry into the AdminAction ledger.
   */
  static async recordAdminAction(params: {
    adminId: string;
    actionType: string;
    targetType: string;
    targetId: string;
    details?: string;
  }) {
    try {
      return await prisma.adminAction.create({
        data: {
          adminId: params.adminId,
          actionType: params.actionType,
          targetType: params.targetType,
          targetId: params.targetId,
          details: params.details || null,
        },
      });
    } catch (err) {
      console.error("Failed to record admin action audit log:", err);
      return null;
    }
  }
}
