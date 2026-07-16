import { Property } from '../../domain/entities/property.aggregate';
import { CharacteristicCategory } from '../../domain/enums/characteristic-category.enum';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../../domain/value-objects/property-characteristic.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { PrismaPropertyMapper } from '../mappers/prisma-property.mapper';

// Mirrors the shape Prisma exposes for a Property row joined with features and tags.
const DEFAULT_FEATURES = {
  totalAreaM2: 120,
  coveredAreaM2: 100,
  rooms: 4,
  bedrooms: 3,
  bathrooms: 2,
  garages: 1,
  floor: 5,
  conservationState: ConservationState.EXCELENTE,
  ageYears: 10,
};

const DEFAULT_TAGS = [
  {
    tag: {
      id: 1,
      name: 'Piscina',
      slug: 'piscina',
      category: CharacteristicCategory.AMENIDAD,
    },
  },
];

// Like `??` but only fires when the override is *undefined*, not when it's null.
// This lets tests pass `null` explicitly to verify null-handling code paths.
function ifDefined<T>(override: T | undefined, fallback: T): T {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return override === undefined ? fallback : override;
}

// eslint-disable-next-line complexity
function makePrismaProperty(overrides: Record<string, unknown> = {}) {
  const o = overrides as {
    id?: string;
    internalCode?: string;
    status?: PropertyStatus;
    propertyType?: PropertyType;
    ownerProfileId?: string | null;
    agentProfileId?: string | null;
    addressPlaceId?: string | null;
    addressFormatted?: string;
    addressStreet?: string | null;
    addressStreetNumber?: string | null;
    addressNeighborhood?: string | null;
    addressCity?: string;
    addressState?: string | null;
    addressCountry?: string;
    addressPostalCode?: string | null;
    addressLatitude?: unknown;
    addressLongitude?: unknown;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    features?: unknown;
    tags?: Array<{
      tag: { id: number; name: string; slug: string; category: CharacteristicCategory };
    }>;
  };
  return {
    id: o.id ?? '550e8400-e29b-41d4-a716-446655440000',
    internalCode: o.internalCode ?? 'PROP-001',
    status: o.status ?? PropertyStatus.DISPONIBLE,
    propertyType: o.propertyType ?? PropertyType.DEPARTAMENTO,
    ownerProfileId: o.ownerProfileId ?? null,
    agentProfileId: o.agentProfileId ?? null,
    addressPlaceId: o.addressPlaceId ?? 'place-1',
    addressFormatted: o.addressFormatted ?? 'Av. Corrientes 1234, CABA',
    addressStreet: o.addressStreet ?? 'Av. Corrientes',
    addressStreetNumber: o.addressStreetNumber ?? '1234',
    addressNeighborhood: o.addressNeighborhood ?? 'San Nicolás',
    addressCity: o.addressCity ?? 'CABA',
    addressState: o.addressState ?? 'Buenos Aires',
    addressCountry: o.addressCountry ?? 'Argentina',
    addressPostalCode: o.addressPostalCode ?? 'C1043',
    addressLatitude: ifDefined(o.addressLatitude, -34.6037),
    addressLongitude: ifDefined(o.addressLongitude, -58.3816),
    createdAt: o.createdAt ?? new Date('2024-01-01T00:00:00Z'),
    updatedAt: o.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
    deletedAt: o.deletedAt ?? null,
    features: ifDefined(o.features, DEFAULT_FEATURES),
    tags: ifDefined(o.tags, DEFAULT_TAGS),
  };
}

describe('PrismaPropertyMapper', () => {
  describe('toDomain()', () => {
    it('should map a full prisma property into a Property aggregate', () => {
      const prismaProperty = makePrismaProperty();

      const property = PrismaPropertyMapper.toDomain(prismaProperty as never);

      expect(property).toBeInstanceOf(Property);
      expect(property.id.toValue()).toBe(prismaProperty.id);
      expect(property.internalCode).toBe('PROP-001');
      expect(property.status).toBe(PropertyStatus.DISPONIBLE);
      expect(property.propertyType).toBe(PropertyType.DEPARTAMENTO);
      expect(property.ownerProfileId).toBeNull();
      expect(property.agentProfileId).toBeNull();
      expect(property.address).toBeInstanceOf(PropertyAddress);
      expect(property.address.addressCity).toBe('CABA');
      expect(property.address.addressCountry).toBe('Argentina');
      expect(property.address.addressFormatted).toBe('Av. Corrientes 1234, CABA');
      expect(property.address.addressLatitude).toBe(-34.6037);
      expect(property.address.addressLongitude).toBe(-58.3816);
      expect(property.features).toBeInstanceOf(PropertyFeatures);
      expect(property.characteristics).toHaveLength(1);
      expect(property.characteristics[0]!).toBeInstanceOf(PropertyCharacteristicValue);
      expect(property.characteristics[0]!.id).toBe(1);
      expect(property.characteristics[0]!.category).toBe(CharacteristicCategory.AMENIDAD);
      expect(property.deletedAt).toBeNull();
    });

    it('should tolerate null addressLatitude/Longitude (Prisma Decimal | null)', () => {
      const prismaProperty = makePrismaProperty({
        addressLatitude: null,
        addressLongitude: null,
      });

      const property = PrismaPropertyMapper.toDomain(prismaProperty as never);

      expect(property.address.addressLatitude).toBeNull();
      expect(property.address.addressLongitude).toBeNull();
    });

    it('should coerce string Decimals to numbers (PostgreSQL Decimal -> string)', () => {
      const prismaProperty = makePrismaProperty({
        addressLatitude: '-34.6037000',
        addressLongitude: '-58.3816000',
      });

      const property = PrismaPropertyMapper.toDomain(prismaProperty as never);

      expect(property.address.addressLatitude).toBe(-34.6037);
      expect(property.address.addressLongitude).toBe(-58.3816);
    });

    it('should preserve the deletedAt timestamp', () => {
      const deletedAt = new Date('2024-06-01T00:00:00Z');
      const prismaProperty = makePrismaProperty({ deletedAt });

      const property = PrismaPropertyMapper.toDomain(prismaProperty as never);

      expect(property.deletedAt).toBe(deletedAt);
    });

    it('should build a Property with no features when missing', () => {
      const prismaProperty = makePrismaProperty({ features: null });

      const property = PrismaPropertyMapper.toDomain(prismaProperty as never);

      expect(property.features).toBeNull();
    });

    it('should build a Property with no characteristics when the join is empty', () => {
      const prismaProperty = makePrismaProperty({ tags: [] });

      const property = PrismaPropertyMapper.toDomain(prismaProperty as never);

      expect(property.characteristics).toEqual([]);
    });
  });

  describe('toPersistence()', () => {
    it('should map a Property aggregate to a flat persistence payload', () => {
      const property = Property.reconstitute({
        id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
        internalCode: 'PROP-002',
        address: new PropertyAddress({
          addressPlaceId: 'place-1',
          addressFormatted: 'Av. Corrientes 1234, CABA',
          addressStreet: 'Av. Corrientes',
          addressStreetNumber: '1234',
          addressNeighborhood: 'San Nicolás',
          addressCity: 'CABA',
          addressState: 'Buenos Aires',
          addressCountry: 'Argentina',
          addressPostalCode: 'C1043',
          addressLatitude: -34.6037,
          addressLongitude: -58.3816,
        }),
        propertyType: PropertyType.DEPARTAMENTO,
        status: PropertyStatus.DISPONIBLE,
        features: new PropertyFeatures({
          totalAreaM2: 120,
          coveredAreaM2: 100,
          rooms: 4,
          bedrooms: 3,
          bathrooms: 2,
          garages: 1,
          floor: 5,
          conservationState: ConservationState.EXCELENTE,
          ageYears: 10,
        }),
        ownerProfileId: 'owner-1',
        agentProfileId: 'agent-1',
        characteristics: [
          PropertyCharacteristicValue.fromPersistence(
            1,
            'Piscina',
            'piscina',
            CharacteristicCategory.AMENIDAD,
          ),
        ],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        deletedAt: null,
      });

      const data = PrismaPropertyMapper.toPersistence(property);

      expect(data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(data.internalCode).toBe('PROP-002');
      expect(data.status).toBe(PropertyStatus.DISPONIBLE);
      expect(data.propertyType).toBe(PropertyType.DEPARTAMENTO);
      expect(data.ownerProfileId).toBe('owner-1');
      expect(data.agentProfileId).toBe('agent-1');
      expect(data.addressCity).toBe('CABA');
      expect(data.addressCountry).toBe('Argentina');
      expect(data.addressFormatted).toBe('Av. Corrientes 1234, CABA');
      expect(data.deletedAt).toBeNull();
      expect(data.features).toMatchObject({
        totalAreaM2: 120,
        coveredAreaM2: 100,
        conservationState: ConservationState.EXCELENTE,
      });
      expect(data.characteristics).toEqual([
        { name: 'Piscina', slug: 'piscina', category: CharacteristicCategory.AMENIDAD },
      ]);
    });

    it('should produce an empty characteristics array when no characteristics exist', () => {
      const property = Property.reconstitute({
        id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
        internalCode: 'PROP-003',
        address: new PropertyAddress({
          addressPlaceId: null,
          addressFormatted: 'Calle 1',
          addressStreet: null,
          addressStreetNumber: null,
          addressNeighborhood: null,
          addressCity: 'CABA',
          addressState: null,
          addressCountry: 'Argentina',
          addressPostalCode: null,
          addressLatitude: null,
          addressLongitude: null,
        }),
        propertyType: PropertyType.CASA,
        status: PropertyStatus.DISPONIBLE,
        features: null,
        ownerProfileId: null,
        agentProfileId: null,
        characteristics: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const data = PrismaPropertyMapper.toPersistence(property);

      expect(data.characteristics).toEqual([]);
    });

    it('should produce null features when property has no features', () => {
      const property = Property.reconstitute({
        id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
        internalCode: 'PROP-004',
        address: new PropertyAddress({
          addressPlaceId: null,
          addressFormatted: 'Calle 1',
          addressStreet: null,
          addressStreetNumber: null,
          addressNeighborhood: null,
          addressCity: 'CABA',
          addressState: null,
          addressCountry: 'Argentina',
          addressPostalCode: null,
          addressLatitude: null,
          addressLongitude: null,
        }),
        propertyType: PropertyType.CASA,
        status: PropertyStatus.DISPONIBLE,
        features: null,
        ownerProfileId: null,
        agentProfileId: null,
        characteristics: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const data = PrismaPropertyMapper.toPersistence(property);

      expect(data.features).toBeNull();
    });
  });
});
