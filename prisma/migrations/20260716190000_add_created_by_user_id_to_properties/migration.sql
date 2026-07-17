-- Add nullable created_by_user_id column to properties for audit tracking.
-- Existing rows are kept as NULL (backward compatible); new creates will set this
-- from the JWT `sub` of the authenticated user.

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "created_by_user_id" TEXT;

-- CreateIndex
CREATE INDEX "properties_created_by_user_id_idx" ON "properties"("created_by_user_id");
