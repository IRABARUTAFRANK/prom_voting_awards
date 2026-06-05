-- AlterTable
ALTER TABLE "Person" ADD COLUMN "className" TEXT;

-- AlterTable
ALTER TABLE "Voter" ADD COLUMN "className" TEXT;
ALTER TABLE "Voter" ADD COLUMN "loginCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Voter_loginCode_key" ON "Voter"("loginCode");
CREATE INDEX "Person_active_fullName_idx" ON "Person"("active", "fullName");
CREATE INDEX "Person_className_idx" ON "Person"("className");
CREATE INDEX "Voter_className_idx" ON "Voter"("className");
CREATE INDEX "Voter_status_idx" ON "Voter"("status");
