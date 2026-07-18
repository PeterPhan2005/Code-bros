-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('FILE', 'FOLDER');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('ACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "ProjectNode" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "status" "NodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "content" TEXT,
    "language" TEXT,
    "mimeType" TEXT,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectNode_pkey" PRIMARY KEY ("id")
);

-- Active names are unique case-insensitively. Separate partial indexes are
-- required because PostgreSQL treats NULL parent IDs as distinct values.
CREATE UNIQUE INDEX "ProjectNode_active_root_name_key"
ON "ProjectNode" ("projectId", LOWER("name"))
WHERE "parentId" IS NULL AND "status" = 'ACTIVE';

CREATE UNIQUE INDEX "ProjectNode_active_nested_name_key"
ON "ProjectNode" ("projectId", "parentId", LOWER("name"))
WHERE "parentId" IS NOT NULL AND "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "ProjectNode_projectId_parentId_status_idx" ON "ProjectNode"("projectId", "parentId", "status");

-- CreateIndex
CREATE INDEX "ProjectNode_projectId_type_idx" ON "ProjectNode"("projectId", "type");

-- CreateIndex
CREATE INDEX "ProjectNode_parentId_idx" ON "ProjectNode"("parentId");

-- CreateIndex
CREATE INDEX "ProjectNode_updatedAt_idx" ON "ProjectNode"("updatedAt");

-- AddForeignKey
ALTER TABLE "ProjectNode" ADD CONSTRAINT "ProjectNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNode" ADD CONSTRAINT "ProjectNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProjectNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNode" ADD CONSTRAINT "ProjectNode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectNode" ADD CONSTRAINT "ProjectNode_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
