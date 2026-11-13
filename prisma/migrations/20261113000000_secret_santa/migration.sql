-- CreateTable
CREATE TABLE "SantaDraw" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "eventDate" VARCHAR(10) NOT NULL,
    "budget" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SantaDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SantaAssignment" (
    "drawId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    CONSTRAINT "SantaAssignment_pkey" PRIMARY KEY ("drawId","giverId")
);

CREATE INDEX "SantaDraw_organizerId_idx" ON "SantaDraw"("organizerId");
CREATE INDEX "SantaAssignment_giverId_idx" ON "SantaAssignment"("giverId");

ALTER TABLE "SantaDraw" ADD CONSTRAINT "SantaDraw_organizerId_fkey"
FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SantaAssignment" ADD CONSTRAINT "SantaAssignment_drawId_fkey"
FOREIGN KEY ("drawId") REFERENCES "SantaDraw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SantaAssignment" ADD CONSTRAINT "SantaAssignment_giverId_fkey"
FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SantaAssignment" ADD CONSTRAINT "SantaAssignment_receiverId_fkey"
FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
