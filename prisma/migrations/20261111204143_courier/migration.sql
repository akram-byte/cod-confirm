-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courier" TEXT,
ADD COLUMN     "courierStatus" TEXT,
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "stopDeskId" INTEGER,
ADD COLUMN     "stopDeskName" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "courierSyncedAt" TIMESTAMP(3);
