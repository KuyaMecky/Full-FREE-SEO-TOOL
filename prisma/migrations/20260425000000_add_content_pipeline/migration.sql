-- CreateTable
CREATE TABLE "WordPressConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'My WordPress Site',
    "siteUrl" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "appPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCluster" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pillarTopic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "clusterId" TEXT,
    "wpConnectionId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "focusKeyword" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "schemaMarkup" TEXT,
    "internalLinks" TEXT NOT NULL DEFAULT '[]',
    "imageSuggestions" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "wpPostId" INTEGER,
    "gscSignals" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WordPressConnection" ADD CONSTRAINT "WordPressConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCluster" ADD CONSTRAINT "ContentCluster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCluster" ADD CONSTRAINT "ContentCluster_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "GscProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "GscProperty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ContentCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_wpConnectionId_fkey" FOREIGN KEY ("wpConnectionId") REFERENCES "WordPressConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
