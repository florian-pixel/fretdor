-- CreateTable
CREATE TABLE "VehicleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleImage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AFFRETEUR',
    "entityType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "rccm" TEXT,
    "cin" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("cin", "createdAt", "email", "entityType", "id", "name", "password", "phone", "rccm", "role", "updatedAt") SELECT "cin", "createdAt", "email", "entityType", "id", "name", "password", "phone", "rccm", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "capacityWeight" REAL,
    "capacityVolume" REAL,
    "isOffRoadCapable" BOOLEAN NOT NULL DEFAULT false,
    "hasDriver" BOOLEAN NOT NULL DEFAULT true,
    "fuelType" TEXT,
    "transmission" TEXT,
    "location" TEXT NOT NULL,
    "pricingType" TEXT NOT NULL DEFAULT 'PER_DAY',
    "pricePerDay" REAL,
    "pricePerKm" REAL,
    "conditions" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "capacityVolume", "capacityWeight", "createdAt", "id", "imageUrl", "isAvailable", "isOffRoadCapable", "location", "model", "ownerId", "pricePerDay", "registrationNumber", "type", "updatedAt") SELECT "brand", "capacityVolume", "capacityWeight", "createdAt", "id", "imageUrl", "isAvailable", "isOffRoadCapable", "location", "model", "ownerId", "pricePerDay", "registrationNumber", "type", "updatedAt" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
