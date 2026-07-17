/*
  Warnings:

  - You are about to drop the column `monthly_expenses` on the `property_features` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_PASSWORD_CHANGE');

-- DropIndex
DROP INDEX "property_features_monthly_expenses_idx";

-- AlterTable
ALTER TABLE "property_features" DROP COLUMN "monthly_expenses";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
