ALTER TABLE "Company" ADD COLUMN "oto" TEXT NOT NULL DEFAULT '000000';

UPDATE "Company"
SET "oto" = printf('%06d', abs(random()) % 1000000);
