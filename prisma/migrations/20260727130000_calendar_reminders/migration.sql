CREATE TYPE "CalendarReminderSourceType" AS ENUM ('BIRTHDAY', 'PERSONAL', 'HOLIDAY');

ALTER TABLE "User"
ADD COLUMN "calendarNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "CalendarEventMute" (
    "userId" TEXT NOT NULL,
    "sourceType" "CalendarReminderSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarEventMute_pkey" PRIMARY KEY ("userId", "sourceType", "sourceId")
);

CREATE TABLE "CalendarReminderDelivery" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "sourceType" "CalendarReminderSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "occurrenceDate" VARCHAR(10) NOT NULL,
    "checkpointDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarReminderDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEventMute_sourceType_sourceId_idx"
ON "CalendarEventMute"("sourceType", "sourceId");
CREATE UNIQUE INDEX "CalendarReminderDelivery_recipientId_sourceType_sourceId_occurrenceDate_checkpointDays_key"
ON "CalendarReminderDelivery"("recipientId", "sourceType", "sourceId", "occurrenceDate", "checkpointDays");
CREATE INDEX "CalendarReminderDelivery_occurrenceDate_idx"
ON "CalendarReminderDelivery"("occurrenceDate");

ALTER TABLE "CalendarEventMute" ADD CONSTRAINT "CalendarEventMute_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarReminderDelivery" ADD CONSTRAINT "CalendarReminderDelivery_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
