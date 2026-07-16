-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('casa', 'departamento', 'ph', 'local', 'oficina', 'terreno', 'cochera', 'galpon');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('disponible', 'reservada', 'vendida', 'alquilada', 'en_proceso', 'no_disponible');

-- CreateEnum
CREATE TYPE "ConservationState" AS ENUM ('a_estrenar', 'excelente', 'muy_bueno', 'bueno', 'regular', 'a_refaccionar');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('servicio', 'amenidad', 'condicion', 'material');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "internal_code" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'disponible',
    "propertyType" "PropertyType" NOT NULL,
    "owner_profile_id" TEXT,
    "agent_profile_id" TEXT,
    "address_place_id" TEXT,
    "address_formatted" TEXT NOT NULL,
    "address_street" TEXT,
    "address_street_number" TEXT,
    "address_neighborhood" TEXT,
    "address_city" TEXT NOT NULL,
    "address_state" TEXT,
    "address_country" TEXT NOT NULL,
    "address_postal_code" TEXT,
    "address_latitude" DECIMAL(10,8),
    "address_longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_features" (
    "property_id" TEXT NOT NULL,
    "total_area_m2" DECIMAL(10,2) NOT NULL,
    "covered_area_m2" DECIMAL(10,2) NOT NULL,
    "rooms" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "garages" INTEGER,
    "floor" INTEGER,
    "conservation_state" "ConservationState",
    "age_years" INTEGER,
    "monthly_expenses" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_features_pkey" PRIMARY KEY ("property_id")
);

-- CreateTable
CREATE TABLE "property_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_feature_tags" (
    "property_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "property_feature_tags_pkey" PRIMARY KEY ("property_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_internal_code_key" ON "properties"("internal_code");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_propertyType_idx" ON "properties"("propertyType");

-- CreateIndex
CREATE INDEX "properties_agent_profile_id_idx" ON "properties"("agent_profile_id");

-- CreateIndex
CREATE INDEX "properties_deleted_at_idx" ON "properties"("deleted_at");

-- CreateIndex
CREATE INDEX "properties_address_city_idx" ON "properties"("address_city");

-- CreateIndex
CREATE INDEX "properties_address_neighborhood_idx" ON "properties"("address_neighborhood");

-- CreateIndex
CREATE INDEX "properties_address_latitude_address_longitude_idx" ON "properties"("address_latitude", "address_longitude");

-- CreateIndex
CREATE INDEX "property_features_total_area_m2_idx" ON "property_features"("total_area_m2");

-- CreateIndex
CREATE INDEX "property_features_covered_area_m2_idx" ON "property_features"("covered_area_m2");

-- CreateIndex
CREATE INDEX "property_features_rooms_idx" ON "property_features"("rooms");

-- CreateIndex
CREATE INDEX "property_features_bedrooms_idx" ON "property_features"("bedrooms");

-- CreateIndex
CREATE INDEX "property_features_bathrooms_idx" ON "property_features"("bathrooms");

-- CreateIndex
CREATE INDEX "property_features_garages_idx" ON "property_features"("garages");

-- CreateIndex
CREATE INDEX "property_features_monthly_expenses_idx" ON "property_features"("monthly_expenses");

-- CreateIndex
CREATE INDEX "property_tags_category_idx" ON "property_tags"("category");

-- CreateIndex
CREATE INDEX "property_tags_is_active_idx" ON "property_tags"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "property_tags_slug_category_key" ON "property_tags"("slug", "category");

-- CreateIndex
CREATE INDEX "property_feature_tags_tag_id_idx" ON "property_feature_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "property_features" ADD CONSTRAINT "property_features_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_feature_tags" ADD CONSTRAINT "property_feature_tags_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_feature_tags" ADD CONSTRAINT "property_feature_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "property_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
