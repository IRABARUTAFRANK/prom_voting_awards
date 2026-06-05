-- AlterTable
ALTER TABLE "Voter" ADD COLUMN "rosterIndex" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Voter_rosterIndex_key" ON "Voter"("rosterIndex");

-- CreateTable
CREATE TABLE "AdminMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "author" TEXT NOT NULL DEFAULT 'Admin',
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
