-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- Add role and isActive to User
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add new nullable columns to Task first (for data migration)
ALTER TABLE "Task" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "Task" ADD COLUMN "createdById" TEXT;

-- Copy existing userId into both new columns
UPDATE "Task" SET "assignedToId" = "userId", "createdById" = "userId";

-- Make them NOT NULL now that data is filled
ALTER TABLE "Task" ALTER COLUMN "assignedToId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "createdById" SET NOT NULL;

-- Drop old foreign key constraint and column
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";
ALTER TABLE "Task" DROP COLUMN "userId";

-- Add new foreign key constraints
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old indices
DROP INDEX IF EXISTS "Task_userId_idx";
DROP INDEX IF EXISTS "Task_userId_priority_idx";
DROP INDEX IF EXISTS "Task_userId_status_idx";
DROP INDEX IF EXISTS "Task_userId_dueDate_idx";

-- Create new indices
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX "Task_assignedToId_priority_idx" ON "Task"("assignedToId", "priority");
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");
CREATE INDEX "Task_assignedToId_dueDate_idx" ON "Task"("assignedToId", "dueDate");
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");
