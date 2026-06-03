-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT,
    "accessCodePlaintext" TEXT,
    "codeRevealedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME
);
INSERT INTO "new_Voter" ("id", "fullName", "email", "codeHash", "status", "createdAt", "approvedAt")
SELECT "id", "fullName", "email", "codeHash", "status", "createdAt", "approvedAt" FROM "Voter";
DROP TABLE "Voter";
ALTER TABLE "new_Voter" RENAME TO "Voter";
CREATE UNIQUE INDEX "Voter_email_key" ON "Voter"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
