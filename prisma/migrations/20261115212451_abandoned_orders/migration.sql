-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('OPEN', 'NO_ANSWER', 'ORDERED', 'RECOVERED', 'DISMISSED');

-- CreateTable
CREATE TABLE "OrderDraft" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerName" TEXT,
    "wilayaCode" INTEGER,
    "communeId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "DraftStatus" NOT NULL DEFAULT 'OPEN',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderDraft_token_key" ON "OrderDraft"("token");

-- CreateIndex
CREATE INDEX "OrderDraft_status_updatedAt_idx" ON "OrderDraft"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "OrderDraft_phone_idx" ON "OrderDraft"("phone");

-- AddForeignKey
ALTER TABLE "OrderDraft" ADD CONSTRAINT "OrderDraft_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
