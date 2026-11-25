-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "callerPasswordHash" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "ProductAdSpend" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAdSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "ProductAdSpend_productId_idx" ON "ProductAdSpend"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAdSpend_date_productId_key" ON "ProductAdSpend"("date", "productId");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- AddForeignKey
ALTER TABLE "ProductAdSpend" ADD CONSTRAINT "ProductAdSpend_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
