/*
  Warnings:

  - Added the required column `parentEmail` to the `Student` table without a default value. This is not possible if the table is not empty.
  - The required column `parentLinkToken` was added to the `Student` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `parentPhone` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "phone" TEXT,
    "fatherPhone" TEXT,
    "birthDate" DATETIME,
    "dateOfJoining" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentLinkToken" TEXT NOT NULL,
    "currentHizb" INTEGER NOT NULL DEFAULT 0,
    "currentQuarter" INTEGER NOT NULL DEFAULT 0,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "currentWeeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "currentWeeklyRating" REAL NOT NULL DEFAULT 0,
    "currentStars" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("birthDate", "createdAt", "currentHizb", "currentQuarter", "currentStars", "currentWeeklyPoints", "currentWeeklyRating", "dateOfJoining", "fatherPhone", "firstName", "id", "isFrozen", "lastName", "phone", "schoolId", "totalPoints", "updatedAt") SELECT "birthDate", "createdAt", "currentHizb", "currentQuarter", "currentStars", "currentWeeklyPoints", "currentWeeklyRating", "dateOfJoining", "fatherPhone", "firstName", "id", "isFrozen", "lastName", "phone", "schoolId", "totalPoints", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_parentLinkToken_key" ON "Student"("parentLinkToken");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
