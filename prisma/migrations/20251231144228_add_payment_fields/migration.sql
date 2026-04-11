-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "paidAt" DATETIME;
ALTER TABLE "Booking" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "Booking" ADD COLUMN "paymentStatus" TEXT;
