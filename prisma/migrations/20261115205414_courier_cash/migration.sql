-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "payoutId" TEXT;

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "expected" INTEGER NOT NULL,
    "collected" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payout_receivedAt_idx" ON "Payout"("receivedAt");

-- CreateIndex
CREATE INDEX "Order_status_payoutId_idx" ON "Order"("status", "payoutId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
