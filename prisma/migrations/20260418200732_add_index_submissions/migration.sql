-- CreateTable
CREATE TABLE "IndexSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastIndexVerdict" TEXT,
    "lastCoverageState" TEXT,
    "lastFetchState" TEXT,
    "lastCrawlTime" DATETIME,
    "lastCheckedAt" DATETIME,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IndexSubmission_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "GscProperty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "IndexSubmission_userId_idx" ON "IndexSubmission"("userId");

-- CreateIndex
CREATE INDEX "IndexSubmission_propertyId_idx" ON "IndexSubmission"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "IndexSubmission_propertyId_url_key" ON "IndexSubmission"("propertyId", "url");
