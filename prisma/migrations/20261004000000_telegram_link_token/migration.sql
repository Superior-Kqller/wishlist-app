-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramLinkTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "telegramLinkTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramLinkTokenHash_key" ON "User"("telegramLinkTokenHash");
