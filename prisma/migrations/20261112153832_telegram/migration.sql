-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "telegramChatId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "telegramCode" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "telegramDaily" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "telegramLocale" TEXT NOT NULL DEFAULT 'ar';
