-- Manual payment review fields
ALTER TABLE "Payment" ADD COLUMN "trxId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "senderNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Payment" ADD COLUMN "reviewNote" TEXT;

CREATE UNIQUE INDEX "Payment_trxId_key" ON "Payment"("trxId");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Private ticket document storage
CREATE TABLE "TicketDocument" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ticketId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TicketDocument_ticketId_key" ON "TicketDocument"("ticketId");
CREATE INDEX "TicketDocument_sha256_idx" ON "TicketDocument"("sha256");

ALTER TABLE "TicketDocument" ADD CONSTRAINT "TicketDocument_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketDocument" ADD CONSTRAINT "TicketDocument_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
