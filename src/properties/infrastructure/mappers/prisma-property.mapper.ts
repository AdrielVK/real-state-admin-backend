import type { TagCategory } from '../../../generated/prisma/enums';
import type {
  PropertyFeaturesModel,
  PropertyFeatureTagModel,
  PropertyModel,
} from '../../../generated/prisma/models';
import { Property } from '../../domain/entities/property.aggregate';
import type { CharacteristicCategory as DomainCharacteristicCategory } from '../../domain/enums/characteristic-category.enum';
import type { ConservationState as DomainConservationState } from '../../domain/enums/conservation-state.enum';
import type { PropertyStatus as DomainPropertyStatus } from '../../domain/enums/property-status.enum';
import type { PropertyType as DomainPropertyType } from '../../domain/enums/property-type.enum';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../../domain/value-objects/property-characteristic.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';

type PrismaPropertyWithRelations = PropertyModel & {
  features: PropertyFeaturesModel | null;
  tags: Array<
    PropertyFeatureTagModel & {
      tag: { id: number; name: string; slug: string; category: TagCategory };
    }
  >;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof (value as { toNumber?: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return null;
}

function toDomainFeatures(prisma: PropertyFeaturesModel): PropertyFeatures {
  return new PropertyFeatures({
    totalAreaM2: toNumber(prisma.totalAreaM2) ?? 0,
    coveredAreaM2: toNumber(prisma.coveredAreaM2) ?? 0,
    rooms: prisma.rooms,
    bedrooms: prisma.bedrooms,
    bathrooms: prisma.bathrooms,
    garages: prisma.garages,
    floor: prisma.floor,
    conservationState: prisma.conservationState as DomainConservationState,
    ageYears: prisma.ageYears,
  });
}

export const PrismaPropertyMapper = {
  toDomain(prismaProperty: PrismaPropertyWithRelations): Property {
    const address = new PropertyAddress({
      addressPlaceId: prismaProperty.addressPlaceId,
      addressFormatted: prismaProperty.addressFormatted,
      addressStreet: prismaProperty.addressStreet,
      addressStreetNumber: prismaProperty.addressStreetNumber,
      addressNeighborhood: prismaProperty.addressNeighborhood,
      addressCity: prismaProperty.addressCity,
      addressState: prismaProperty.addressState,
      addressCountry: prismaProperty.addressCountry,
      addressPostalCode: prismaProperty.addressPostalCode,
      addressLatitude: toNumber(prismaProperty.addressLatitude),
      addressLongitude: toNumber(prismaProperty.addressLongitude),
    });

    const features = prismaProperty.features ? toDomainFeatures(prismaProperty.features) : null;

    const characteristics = prismaProperty.tags.map((t) =>
      PropertyCharacteristicValue.fromPersistence(
        t.tag.id,
        t.tag.name,
        t.tag.slug,
        t.tag.category as DomainCharacteristicCategory,
      ),
    );

    return Property.reconstitute({
      id: new PropertyId(prismaProperty.id),
      internalCode: prismaProperty.internalCode,
      address,
      propertyType: prismaProperty.propertyType as DomainPropertyType,
      status: prismaProperty.status as DomainPropertyStatus,
      features,
      ownerProfileId: prismaProperty.ownerProfileId,
      agentProfileId: prismaProperty.agentProfileId,
      createdByUserId: prismaProperty.createdByUserId,
      characteristics,
      createdAt: prismaProperty.createdAt,
      updatedAt: prismaProperty.updatedAt,
      deletedAt: prismaProperty.deletedAt,
    });
  },

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  toPersistence(property: Property) {
    const { address } = property;
    const { features } = property;
    const { characteristics } = property;

    return {
      id: property.id.toValue(),
      internalCode: property.internalCode,
      status: property.status,
      propertyType: property.propertyType,
      ownerProfileId: property.ownerProfileId ?? null,
      agentProfileId: property.agentProfileId ?? null,
      createdByUserId: property.createdByUserId ?? null,
      addressPlaceId: address.addressPlaceId,
      addressFormatted: address.addressFormatted,
      addressStreet: address.addressStreet,
      addressStreetNumber: address.addressStreetNumber,
      addressNeighborhood: address.addressNeighborhood,
      addressCity: address.addressCity,
      addressState: address.addressState ?? null,
      addressCountry: address.addressCountry,
      addressPostalCode: address.addressPostalCode,
      addressLatitude: address.addressLatitude,
      addressLongitude: address.addressLongitude,
      deletedAt: property.deletedAt ?? null,
      features: features
        ? {
            totalAreaM2: features.totalAreaM2,
            coveredAreaM2: features.coveredAreaM2,
            rooms: features.rooms,
            bedrooms: features.bedrooms,
            bathrooms: features.bathrooms,
            garages: features.garages,
            floor: features.floor,
            conservationState: features.conservationState,
            ageYears: features.ageYears,
          }
        : null,
      characteristics: characteristics.map((c) => ({
        slug: c.slug,
        name: c.name,
        category: c.category,
      })),
    };
  },
};
