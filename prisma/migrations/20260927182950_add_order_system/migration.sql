-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "quantity" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Ticket_sellerId_idx" ON "Ticket"("sellerId");
