-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "fastFill" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fillSeconds" INTEGER,
ADD COLUMN     "sharedDevice" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Order_deviceId_createdAt_idx" ON "Order"("deviceId", "createdAt");
