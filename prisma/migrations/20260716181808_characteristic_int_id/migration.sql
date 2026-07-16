/*
  Warnings:

  - The primary key for the `property_feature_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `property_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `property_tags` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `tag_id` on the `property_feature_tags` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "property_feature_tags" DROP CONSTRAINT "property_feature_tags_tag_id_fkey";

-- AlterTable
ALTER TABLE "property_feature_tags" DROP CONSTRAINT "property_feature_tags_pkey",
DROP COLUMN "tag_id",
ADD COLUMN     "tag_id" INTEGER NOT NULL,
ADD CONSTRAINT "property_feature_tags_pkey" PRIMARY KEY ("property_id", "tag_id");

-- AlterTable
ALTER TABLE "property_tags" DROP CONSTRAINT "property_tags_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "property_tags_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "property_feature_tags_tag_id_idx" ON "property_feature_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "property_feature_tags" ADD CONSTRAINT "property_feature_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "property_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
