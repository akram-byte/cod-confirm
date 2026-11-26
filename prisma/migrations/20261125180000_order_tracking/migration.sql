-- AlterTable: private link for the customer's tracking page.
-- The default is volatile, so every existing order gets its own random token too.
ALTER TABLE "Order" ADD COLUMN     "trackToken" TEXT NOT NULL DEFAULT replace((gen_random_uuid())::text, '-'::text, ''::text);

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackToken_key" ON "Order"("trackToken");
