-- Redefine SystemSettings without Google Form URLs
CREATE TABLE "new_SystemSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "nominationOpen" BOOLEAN NOT NULL DEFAULT false,
    "finalVoteOpen" BOOLEAN NOT NULL DEFAULT false,
    "minApprovedVoters" INTEGER NOT NULL DEFAULT 1,
    "schoolEmailDomain" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SystemSettings" ("id", "registrationOpen", "nominationOpen", "finalVoteOpen", "minApprovedVoters", "schoolEmailDomain", "updatedAt")
SELECT "id", "registrationOpen", "nominationOpen", "finalVoteOpen", "minApprovedVoters", "schoolEmailDomain", "updatedAt" FROM "SystemSettings";
DROP TABLE "SystemSettings";
ALTER TABLE "new_SystemSettings" RENAME TO "SystemSettings";

-- Redefine Voter without Google Form flags
CREATE TABLE "new_Voter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME
);
INSERT INTO "new_Voter" ("id", "fullName", "email", "codeHash", "status", "createdAt", "approvedAt")
SELECT "id", "fullName", "email", "codeHash", "status", "createdAt", "approvedAt" FROM "Voter";
DROP TABLE "Voter";
ALTER TABLE "new_Voter" RENAME TO "Voter";
CREATE UNIQUE INDEX "Voter_email_key" ON "Voter"("email");
