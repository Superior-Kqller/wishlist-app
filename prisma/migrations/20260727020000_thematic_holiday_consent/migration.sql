CREATE TYPE "ProfileGender" AS ENUM ('MALE', 'FEMALE');

ALTER TABLE "User"
ADD COLUMN "gender" "ProfileGender",
ADD COLUMN "thematicHolidayConsent" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_thematicHolidayConsent_gender_idx"
ON "User"("thematicHolidayConsent", "gender");
