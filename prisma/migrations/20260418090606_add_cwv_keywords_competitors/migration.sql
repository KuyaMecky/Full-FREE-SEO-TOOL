-- CreateTable
CREATE TABLE "CwvResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "performanceScore" REAL,
    "accessibilityScore" REAL,
    "seoScore" REAL,
    "bestPracticesScore" REAL,
    "lcpMs" INTEGER,
    "fcpMs" INTEGER,
    "clsScore" REAL,
    "inpMs" INTEGER,
    "ttfbMs" INTEGER,
    "speedIndex" INTEGER,
    "fieldData" TEXT NOT NULL DEFAULT 'null',
    "topIssues" TEXT NOT NULL DEFAULT '[]',
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CwvResult_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "language" TEXT NOT NULL DEFAULT 'en',
    "businessType" TEXT NOT NULL DEFAULT '',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "priorityPages" TEXT NOT NULL DEFAULT '[]',
    "competitors" TEXT NOT NULL DEFAULT '[]',
    "seedKeywords" TEXT NOT NULL DEFAULT '[]',
    "cmsStack" TEXT NOT NULL DEFAULT '',
    "maxPages" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "overallScore" REAL,
    "errorMessage" TEXT,
    "keywordReport" TEXT,
    "competitorReport" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Audit" ("businessType", "cmsStack", "competitors", "country", "createdAt", "domain", "errorMessage", "goals", "id", "language", "maxPages", "overallScore", "priorityPages", "status", "updatedAt", "userId") SELECT "businessType", "cmsStack", "competitors", "country", "createdAt", "domain", "errorMessage", "goals", "id", "language", "maxPages", "overallScore", "priorityPages", "status", "updatedAt", "userId" FROM "Audit";
DROP TABLE "Audit";
ALTER TABLE "new_Audit" RENAME TO "Audit";
CREATE INDEX "Audit_userId_idx" ON "Audit"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CwvResult_auditId_idx" ON "CwvResult"("auditId");

-- CreateIndex
CREATE UNIQUE INDEX "CwvResult_auditId_url_strategy_key" ON "CwvResult"("auditId", "url", "strategy");
