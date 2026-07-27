CREATE TABLE "CalendarInstallationSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "timeZone" VARCHAR(100) NOT NULL DEFAULT 'Europe/Moscow',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarInstallationSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CalendarInstallationSettings_singleton" CHECK ("id" = 1)
);

INSERT INTO "CalendarInstallationSettings" ("id", "timeZone", "updatedAt")
VALUES (1, 'Europe/Moscow', CURRENT_TIMESTAMP);
