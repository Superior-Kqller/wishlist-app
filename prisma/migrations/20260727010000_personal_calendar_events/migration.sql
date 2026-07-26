-- CreateEnum
CREATE TYPE "PersonalEventRecurrence" AS ENUM ('ONCE', 'YEARLY');

-- CreateTable
CREATE TABLE "PersonalEvent" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000),
    "localDate" VARCHAR(10) NOT NULL,
    "recurrence" "PersonalEventRecurrence" NOT NULL,
    "audience" "BirthdayAudience" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PersonalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalEventViewer" (
    "eventId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonalEventViewer_pkey" PRIMARY KEY ("eventId","viewerId")
);

CREATE INDEX "PersonalEvent_ownerId_idx" ON "PersonalEvent"("ownerId");
CREATE INDEX "PersonalEvent_localDate_idx" ON "PersonalEvent"("localDate");
CREATE INDEX "PersonalEvent_audience_idx" ON "PersonalEvent"("audience");
CREATE INDEX "PersonalEventViewer_viewerId_idx" ON "PersonalEventViewer"("viewerId");

ALTER TABLE "PersonalEvent" ADD CONSTRAINT "PersonalEvent_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalEventViewer" ADD CONSTRAINT "PersonalEventViewer_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "PersonalEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalEventViewer" ADD CONSTRAINT "PersonalEventViewer_viewerId_fkey"
FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
