-- Keep legacy data, but allow current-schema writes that no longer populate these columns.
ALTER TABLE "Ticket" ALTER COLUMN "category" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "totalAmount" DROP NOT NULL;
