-- AlterTable Vehicle: new identification fields
ALTER TABLE "Vehicle" ADD COLUMN "firstRegistrationDate" DATETIME;
ALTER TABLE "Vehicle" ADD COLUMN "trailerRegistrationNumber" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "color" TEXT;

-- AlterTable Vehicle: new features
ALTER TABLE "Vehicle" ADD COLUMN "hasConvoyeur" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Vehicle: new pricing fields
ALTER TABLE "Vehicle" ADD COLUMN "pricePerTonneKm" REAL;
ALTER TABLE "Vehicle" ADD COLUMN "minPrice" REAL;
ALTER TABLE "Vehicle" ADD COLUMN "maxPrice" REAL;

-- AlterTable Vehicle: documents
ALTER TABLE "Vehicle" ADD COLUMN "assuranceDocUrl" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "visiteTechniqueDocUrl" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "carteGriseDocUrl" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "patenteDocUrl" TEXT;

-- AlterTable Vehicle: side photos
ALTER TABLE "Vehicle" ADD COLUMN "photoFrontUrl" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "photoRearUrl" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "photoLeftUrl" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "photoRightUrl" TEXT;

-- AlterTable Booking: affreteur budget range
ALTER TABLE "Booking" ADD COLUMN "minBudget" REAL;
ALTER TABLE "Booking" ADD COLUMN "maxBudget" REAL;
