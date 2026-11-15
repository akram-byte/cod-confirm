-- CreateEnum
CREATE TYPE "RescueResult" AS ENUM ('WILL_RECEIVE', 'NO_ANSWER', 'REFUSED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "rescueCalls" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rescueNote" TEXT,
ADD COLUMN     "rescueOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rescueResult" "RescueResult",
ADD COLUMN     "rescuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Order_rescueOpen_status_idx" ON "Order"("rescueOpen", "status");
