CREATE TYPE "HolidayRuleKind" AS ENUM ('FIXED', 'NTH_WEEKDAY');
CREATE TYPE "HolidayTheme" AS ENUM ('MALE', 'FEMALE');

CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "seedKey" TEXT,
    "name" TEXT NOT NULL,
    "ruleKind" "HolidayRuleKind" NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER,
    "weekday" INTEGER,
    "occurrence" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "remindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "theme" "HolidayTheme",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Holiday_rule_check" CHECK (
      ("ruleKind" = 'FIXED' AND "day" IS NOT NULL AND "weekday" IS NULL AND "occurrence" IS NULL)
      OR
      ("ruleKind" = 'NTH_WEEKDAY' AND "day" IS NULL AND "weekday" IS NOT NULL AND "occurrence" IS NOT NULL)
    ),
    CONSTRAINT "Holiday_month_check" CHECK ("month" BETWEEN 1 AND 12),
    CONSTRAINT "Holiday_day_check" CHECK ("day" IS NULL OR "day" BETWEEN 1 AND 31),
    CONSTRAINT "Holiday_weekday_check" CHECK ("weekday" IS NULL OR "weekday" BETWEEN 0 AND 6),
    CONSTRAINT "Holiday_occurrence_check" CHECK ("occurrence" IS NULL OR "occurrence" IN (-1, 1, 2, 3, 4))
);

CREATE UNIQUE INDEX "Holiday_seedKey_key" ON "Holiday"("seedKey");
CREATE INDEX "Holiday_enabled_idx" ON "Holiday"("enabled");
