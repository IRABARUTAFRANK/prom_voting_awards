-- AlterTable
ALTER TABLE "Voter" ADD COLUMN "removedAt" DATETIME;
ALTER TABLE "Voter" ADD COLUMN "removalReason" TEXT;
