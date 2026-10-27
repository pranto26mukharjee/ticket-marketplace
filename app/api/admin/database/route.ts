import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
|--------------------------------------------------------------------------
| GET /api/admin/database
|--------------------------------------------------------------------------
| Read-only database explorer for administrators.
|   (no params)                      -> table list with row counts
|   ?table=Order&page=1&search=abc   -> paginated rows
|   ?table=Order&format=csv          -> CSV export (up to 5000 rows, audited)
| Secrets (password hashes, raw PDF bytes) are never returned. Changes to
| data go through the audited admin actions, not through this endpoint.
*/

type Delegate = {
  count(args?: { where?: object }): Promise<number>;
  findMany(args: object): Promise<Record<string, unknown>[]>;
};

interface TableConfig {
  delegate: () => Delegate;
  searchFields: string[];
  omit?: Record<string, true>;
  orderBy?: object;
  /** Table has a composite key instead of an `id` column. */
  noId?: boolean;
}

const TABLES: Record<string, TableConfig> = {
  User: {
    delegate: () => prisma.user as unknown as Delegate,
    searchFields: ["email", "fullName", "phone", "username"],
    omit: { passwordHash: true },
    orderBy: { createdAt: "desc" },
  },
  UserProfile: { delegate: () => prisma.userProfile as unknown as Delegate, searchFields: ["fullName", "userId"] },
  Ticket: {
    delegate: () => prisma.ticket as unknown as Delegate,
    searchFields: ["title", "from", "to", "ticketCode", "sellerId"],
    orderBy: { createdAt: "desc" },
  },
  TicketVerification: {
    delegate: () => prisma.ticketVerification as unknown as Delegate,
    searchFields: ["ticketId", "verificationStatus", "requestedById"],
  },
  TicketDocument: {
    delegate: () => prisma.ticketDocument as unknown as Delegate,
    searchFields: ["fileName", "sha256", "ownerId", "ticketId"],
    omit: { data: true },
    orderBy: { createdAt: "desc" },
  },
  TicketCategory: { delegate: () => prisma.ticketCategory as unknown as Delegate, searchFields: ["categoryName"] },
  Order: {
    delegate: () => prisma.order as unknown as Delegate,
    searchFields: ["buyerId", "ticketId", "orderStatus"],
    orderBy: { createdAt: "desc" },
  },
  Payment: {
    delegate: () => prisma.payment as unknown as Delegate,
    searchFields: ["orderId", "trxId", "senderNumber", "gatewayReference", "paymentStatus"],
  },
  Transaction: { delegate: () => prisma.transaction as unknown as Delegate, searchFields: ["orderId", "transactionType"] },
  Review: { delegate: () => prisma.review as unknown as Delegate, searchFields: ["orderId", "reviewerId", "revieweeId"] },
  Report: { delegate: () => prisma.report as unknown as Delegate, searchFields: ["reporterId", "reason", "reportStatus"] },
  Dispute: { delegate: () => prisma.dispute as unknown as Delegate, searchFields: ["orderId", "disputeStatus"] },
  Notification: {
    delegate: () => prisma.notification as unknown as Delegate,
    searchFields: ["userId", "type", "message"],
    orderBy: { createdAt: "desc" },
  },
  AdminAction: {
    delegate: () => prisma.adminAction as unknown as Delegate,
    searchFields: ["adminId", "actionType", "targetId"],
    orderBy: { createdAt: "desc" },
  },
  FraudAlert: {
    delegate: () => prisma.fraudAlert as unknown as Delegate,
    searchFields: ["alertType", "severity", "alertStatus", "relatedUserId"],
    orderBy: { createdAt: "desc" },
  },
  Favorite: { delegate: () => prisma.favorite as unknown as Delegate, searchFields: ["userId", "ticketId"] },
  Event: { delegate: () => prisma.event as unknown as Delegate, searchFields: ["eventName", "venue"] },
  Travel: { delegate: () => prisma.travel as unknown as Delegate, searchFields: ["origin", "destination", "travelMode"] },
  TicketListing: { delegate: () => prisma.ticketListing as unknown as Delegate, searchFields: ["ticketId", "listingStatus"] },
  Role: { delegate: () => prisma.role as unknown as Delegate, searchFields: ["roleName"] },
  UserRole: { delegate: () => prisma.userRole as unknown as Delegate, searchFields: ["userId", "roleId"], noId: true },
};

function buildWhere(config: TableConfig, search: string): object | undefined {
  if (!search) return undefined;
  return {
    OR: [
      ...(config.noId ? [] : [{ id: search }]),
      ...config.searchFields.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })),
    ],
  };
}

function toCsv(rows: Record<string, unknown>[]): string {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
    // Prefix formula-like cells so spreadsheets don't execute them
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return [columns.join(","), ...rows.map((row) => columns.map((c) => escape(row[c])).join(","))].join("\n");
}

export async function GET(request: Request) {
  const session = await getAuthUser(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Administrator access required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");

    if (!table) {
      const counts = await Promise.all(
        Object.entries(TABLES).map(async ([name, config]) => ({
          name,
          rows: await config.delegate().count(),
        }))
      );
      return NextResponse.json({ success: true, tables: counts });
    }

    const config = TABLES[table];
    if (!config) {
      return NextResponse.json({ success: false, message: "Unknown table." }, { status: 400 });
    }

    const search = searchParams.get("search")?.trim().slice(0, 100) || "";
    const where = buildWhere(config, search);
    const delegate = config.delegate();

    if (searchParams.get("format") === "csv") {
      const rows = await delegate.findMany({ where, omit: config.omit, orderBy: config.orderBy, take: 5000 });

      await prisma.adminAction.create({
        data: {
          adminId: session.userId,
          actionType: "EXPORT_TABLE",
          targetType: "DATABASE",
          targetId: table,
          details: `${rows.length} rows${search ? `, filter "${search}"` : ""}`,
        },
      });

      return new NextResponse(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${table}-${new Date().toISOString().slice(0, 10)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "25", 10) || 25));

    const [total, rows] = await Promise.all([
      delegate.count({ where }),
      delegate.findMany({
        where,
        omit: config.omit,
        orderBy: config.orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      table,
      rows,
      hiddenFields: Object.keys(config.omit ?? {}),
      pagination: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("Admin database explorer error:", error);
    return NextResponse.json({ success: false, message: "Failed to query the database." }, { status: 500 });
  }
}
