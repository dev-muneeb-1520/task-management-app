-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'USER_REGISTERED',
  'USER_STATUS_CHANGED',
  'TASK_ASSIGNED',
  'TASK_UPDATED',
  'TASK_COMPLETED',
  'TASK_DUE_SOON',
  'TASK_OVERDUE',
  'ACCOUNT_STATUS_CHANGED',
  'SYSTEM_NOTICE'
);

-- CreateTable
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "recipientUserId" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "actionUrl" TEXT,
  "metadata" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_isRead_createdAt_idx"
ON "Notification"("recipientUserId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_createdAt_idx"
ON "Notification"("recipientUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_recipientUserId_fkey"
FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
