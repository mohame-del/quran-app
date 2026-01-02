-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sheikhName" TEXT,
    "email" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Section_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sectionId" TEXT,
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
    CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("birthDate", "createdAt", "currentHizb", "currentQuarter", "currentStars", "currentWeeklyPoints", "currentWeeklyRating", "dateOfJoining", "fatherPhone", "firstName", "id", "isFrozen", "lastName", "parentEmail", "parentLinkToken", "parentPhone", "phone", "schoolId", "totalPoints", "updatedAt") SELECT "birthDate", "createdAt", "currentHizb", "currentQuarter", "currentStars", "currentWeeklyPoints", "currentWeeklyRating", "dateOfJoining", "fatherPhone", "firstName", "id", "isFrozen", "lastName", "parentEmail", "parentLinkToken", "parentPhone", "phone", "schoolId", "totalPoints", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_parentLinkToken_key" ON "Student"("parentLinkToken");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
