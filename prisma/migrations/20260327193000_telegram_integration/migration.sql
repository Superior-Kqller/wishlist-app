-- Add Telegram integration fields to users.
ALTER TABLE "User"
ADD COLUMN "telegramId" TEXT,
ADD COLUMN "telegramUsername" TEXT,
ADD COLUMN "telegramLinkedAt" TIMESTAMP(3),
ADD COLUMN "telegramConfirmedAt" TIMESTAMP(3),
ADD COLUMN "telegramNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE INDEX "User_telegramConfirmedAt_idx" ON "User"("telegramConfirmedAt");
