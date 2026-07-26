CREATE TYPE "BirthdayAudience" AS ENUM ('ALL', 'SELECTED', 'PRIVATE');

ALTER TABLE "User"
ADD COLUMN "birthdayDay" INTEGER,
ADD COLUMN "birthdayMonth" INTEGER,
ADD COLUMN "birthdayYear" INTEGER,
ADD COLUMN "birthdayAudience" "BirthdayAudience" NOT NULL DEFAULT 'PRIVATE';

CREATE TABLE "BirthdayViewer" (
  "ownerId" TEXT NOT NULL,
  "viewerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BirthdayViewer_pkey" PRIMARY KEY ("ownerId", "viewerId")
);

CREATE INDEX "BirthdayViewer_viewerId_idx" ON "BirthdayViewer"("viewerId");

ALTER TABLE "BirthdayViewer"
ADD CONSTRAINT "BirthdayViewer_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BirthdayViewer"
ADD CONSTRAINT "BirthdayViewer_viewerId_fkey"
FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
