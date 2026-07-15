import type { PropertyType as PrismaPropertyType } from '../../../generated/prisma/enums';
import type { InputJsonValue } from '../../../generated/prisma/internal/prismaNamespace';
import type { PropertyFeaturesModel, PropertyModel } from '../../../generated/prisma/models';
import { Property } from '../../domain/entities/property.aggregate';
import type { ConservationState } from '../../domain/enums/conservation-state.enum';
import type { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { PropertyInternalId } from '../../domain/value-objects/property-internal-id.value-object';

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  if (value && typeof (value as { toNumber?: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((v): v is string => typeof v === 'string');
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export const PrismaPropertyMapper = {
  toDomain(prismaProperty: PropertyModel, prismaFeatures: PropertyFeaturesModel | null): Property {
    const address = new PropertyAddress({
      placeId: prismaProperty.placeId,
      formatted: prismaProperty.formatted,
      street: prismaProperty.street,
      streetNumber: prismaProperty.streetNumber,
      floor: prismaProperty.floor,
      apartment: prismaProperty.apartment,
      neighborhood: prismaProperty.neighborhood,
      city: prismaProperty.city,
      province: prismaProperty.province,
      country: prismaProperty.country,
      postalCode: prismaProperty.postalCode,
      latitude: toNumber(prismaProperty.latitude),
      longitude: toNumber(prismaProperty.longitude),
    });

    const features = prismaFeatures
      ? PropertyFeatures.create({
          propertyType: prismaFeatures.propertyType as PropertyType,
          conservationState:
            prismaFeatures.conservationState === null
              ? null
              : (prismaFeatures.conservationState as ConservationState),
          totalAreaM2: prismaFeatures.totalAreaM2,
          coveredAreaM2: prismaFeatures.coveredAreaM2,
          uncoveredAreaM2: prismaFeatures.uncoveredAreaM2,
          frontMeters: prismaFeatures.frontMeters,
          backMeters: prismaFeatures.backMeters,
          rooms: prismaFeatures.rooms,
          bedrooms: prismaFeatures.bedrooms,
          bathrooms: prismaFeatures.bathrooms,
          toilettes: prismaFeatures.toilettes,
          garages: prismaFeatures.garages,
          floorNumber: prismaFeatures.floorNumber,
          unitIdentifier: prismaFeatures.unitIdentifier,
          constructionYear: prismaFeatures.constructionYear,
          orientation: prismaFeatures.orientation,
          serviceTags: toStringArray(prismaFeatures.serviceTags),
          amenityTags: toStringArray(prismaFeatures.amenityTags),
          conditionTags: toStringArray(prismaFeatures.conditionTags),
          extraFeatures: toRecord(prismaFeatures.extraFeatures),
        })
      : PropertyFeatures.create({ propertyType: PropertyType.DEPARTAMENTO });

    const internalId =
      prismaProperty.internalId === null
        ? null
        : PropertyInternalId.create(prismaProperty.internalId);

    return Property.reconstitute(
      new PropertyId(prismaProperty.id),
      address,
      features,
      internalId,
      prismaProperty.status as PropertyStatus,
      prismaProperty.createdAt,
      prismaProperty.updatedAt,
    );
  },

  toPrisma(property: Property): {
    property: {
      id: string;
      internalId: string | null;
      status: PropertyStatus;
      placeId: string;
      formatted: string;
      street: string | null;
      streetNumber: string | null;
      floor: string | null;
      apartment: string | null;
      neighborhood: string | null;
      city: string | null;
      province: string | null;
      country: string | null;
      postalCode: string | null;
      latitude: number;
      longitude: number;
      createdAt: Date;
      updatedAt: Date;
    };
    features: {
      propertyType: PrismaPropertyType;
      conservationState: ConservationState | null;
      totalAreaM2: number | null;
      coveredAreaM2: number | null;
      uncoveredAreaM2: number | null;
      frontMeters: number | null;
      backMeters: number | null;
      rooms: number | null;
      bedrooms: number | null;
      bathrooms: number | null;
      toilettes: number | null;
      garages: number | null;
      floorNumber: number | null;
      unitIdentifier: string | null;
      constructionYear: number | null;
      orientation: string | null;
      serviceTags: InputJsonValue;
      amenityTags: InputJsonValue;
      conditionTags: InputJsonValue;
      extraFeatures: InputJsonValue;
    };
  } {
    return {
      property: {
        id: property.id.toValue(),
        internalId: property.internalId?.value ?? null,
        status: property.status,
        placeId: property.address.placeId,
        formatted: property.address.formatted,
        street: property.address.street,
        streetNumber: property.address.streetNumber,
        floor: property.address.floor,
        apartment: property.address.apartment,
        neighborhood: property.address.neighborhood,
        city: property.address.city,
        province: property.address.province,
        country: property.address.country,
        postalCode: property.address.postalCode,
        latitude: property.address.latitude,
        longitude: property.address.longitude,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
      features: {
        propertyType: property.features.propertyType,
        conservationState: property.features.conservationState,
        totalAreaM2: property.features.totalAreaM2,
        coveredAreaM2: property.features.coveredAreaM2,
        uncoveredAreaM2: property.features.uncoveredAreaM2,
        frontMeters: property.features.frontMeters,
        backMeters: property.features.backMeters,
        rooms: property.features.rooms,
        bedrooms: property.features.bedrooms,
        bathrooms: property.features.bathrooms,
        toilettes: property.features.toilettes,
        garages: property.features.garages,
        floorNumber: property.features.floorNumber,
        unitIdentifier: property.features.unitIdentifier,
        constructionYear: property.features.constructionYear,
        orientation: property.features.orientation,
        serviceTags: [...property.features.serviceTags] as InputJsonValue,
        amenityTags: [...property.features.amenityTags] as InputJsonValue,
        conditionTags: [...property.features.conditionTags] as InputJsonValue,
        extraFeatures: { ...property.features.extraFeatures } as InputJsonValue,
      },
    };
  },
};
