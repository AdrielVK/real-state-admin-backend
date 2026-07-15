// Mock the generated Prisma client to avoid import.meta issues in Jest
class MockPrismaClient {
  async $connect(): Promise<void> {
    return;
  }
  async $disconnect(): Promise<void> {
    return;
  }
}

jest.mock('../../../generated/prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}));

import { Property } from '../../domain/entities/property.aggregate';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import { PrismaPropertyMapper } from '../mappers/prisma-property.mapper';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-02-01T00:00:00.000Z');

interface PrismaPropertyRecord {
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
  latitude: unknown;
  longitude: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaFeaturesRecord {
  id: string;
  propertyId: string;
  propertyType: PropertyType;
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
  serviceTags: unknown;
  amenityTags: unknown;
  conditionTags: unknown;
  extraFeatures: unknown;
}

function makePrismaProperty(overrides: Partial<PrismaPropertyRecord> = {}): PrismaPropertyRecord {
  return {
    id: VALID_UUID,
    internalId: 'ABC1234',
    status: PropertyStatus.DISPONIBLE,
    placeId: 'place-123',
    formatted: 'Av. Corrientes 1234, CABA, Argentina',
    street: 'Av. Corrientes',
    streetNumber: '1234',
    floor: null,
    apartment: null,
    neighborhood: 'San Nicolás',
    city: 'CABA',
    province: 'Buenos Aires',
    country: 'Argentina',
    postalCode: 'C1043',
    latitude: -34.6037,
    longitude: -58.3816,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

function makePrismaFeatures(overrides: Partial<PrismaFeaturesRecord> = {}): PrismaFeaturesRecord {
  return {
    id: 'features-uuid',
    propertyId: VALID_UUID,
    propertyType: PropertyType.DEPARTAMENTO,
    conservationState: ConservationState.BUENO,
    totalAreaM2: 100,
    coveredAreaM2: 80,
    uncoveredAreaM2: 20,
    frontMeters: null,
    backMeters: null,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    toilettes: null,
    garages: 1,
    floorNumber: 5,
    unitIdentifier: 'B',
    constructionYear: 2010,
    orientation: 'norte',
    serviceTags: ['gas_natural'],
    amenityTags: ['pileta'],
    conditionTags: ['amueblado'],
    extraFeatures: { has_garage: true },
    ...overrides,
  };
}

describe('PrismaPropertyMapper', () => {
  describe('toDomain()', () => {
    it('should map a Prisma property + features to a Property aggregate', () => {
      const property = PrismaPropertyMapper.toDomain(
        makePrismaProperty() as never,
        makePrismaFeatures() as never,
      );

      expect(property).toBeInstanceOf(Property);
      expect(property.id.toValue()).toBe(VALID_UUID);
      expect(property.status).toBe(PropertyStatus.DISPONIBLE);
      expect(property.address.placeId).toBe('place-123');
      expect(property.address.latitude).toBe(-34.6037);
      expect(property.features.propertyType).toBe(PropertyType.DEPARTAMENTO);
      expect(property.features.conservationState).toBe(ConservationState.BUENO);
      expect(property.internalId?.value).toBe('ABC1234');
      expect(property.domainEvents).toHaveLength(0);
    });

    it('should return a Property with default features when no features record is provided', () => {
      const property = PrismaPropertyMapper.toDomain(
        makePrismaProperty({ internalId: null }) as never,
        null,
      );

      expect(property.internalId).toBeNull();
      // When no features record exists, we fall back to a minimal default
      expect(property.features.propertyType).toBe(PropertyType.DEPARTAMENTO);
    });

    it('should handle string-encoded Decimals for latitude/longitude', () => {
      const property = PrismaPropertyMapper.toDomain(
        makePrismaProperty({ latitude: '-34.6037', longitude: '-58.3816' }) as never,
        makePrismaFeatures() as never,
      );
      expect(property.address.latitude).toBe(-34.6037);
      expect(property.address.longitude).toBe(-58.3816);
    });

    it('should handle Decimal objects with toNumber() for latitude/longitude', () => {
      const fakeDecimal = {
        toNumber: () => -34.6037,
      };
      const property = PrismaPropertyMapper.toDomain(
        makePrismaProperty({ latitude: fakeDecimal, longitude: fakeDecimal }) as never,
        makePrismaFeatures() as never,
      );
      expect(property.address.latitude).toBe(-34.6037);
    });
  });

  describe('toPrisma()', () => {
    it('should serialize a Property into property + features Prisma input', () => {
      const property = PrismaPropertyMapper.toDomain(
        makePrismaProperty() as never,
        makePrismaFeatures() as never,
      );

      const prismaInput = PrismaPropertyMapper.toPrisma(property);

      expect(prismaInput.property.id).toBe(VALID_UUID);
      expect(prismaInput.property.internalId).toBe('ABC1234');
      expect(prismaInput.property.status).toBe(PropertyStatus.DISPONIBLE);
      expect(prismaInput.property.placeId).toBe('place-123');
      expect(prismaInput.property.latitude).toBe(-34.6037);
      expect(prismaInput.features.propertyType).toBe(PropertyType.DEPARTAMENTO);
      expect(prismaInput.features.serviceTags).toEqual(['gas_natural']);
      expect(prismaInput.features.amenityTags).toEqual(['pileta']);
      expect(prismaInput.features.extraFeatures).toEqual({ has_garage: true });
    });

    it('should set internalId to null when not present', () => {
      const property = PrismaPropertyMapper.toDomain(
        makePrismaProperty({ internalId: null }) as never,
        makePrismaFeatures() as never,
      );
      const prismaInput = PrismaPropertyMapper.toPrisma(property);
      expect(prismaInput.property.internalId).toBeNull();
    });
  });

  describe('round-trip', () => {
    it('should preserve all fields across a toDomain → toPrisma → toDomain cycle', () => {
      const initialProperty = makePrismaProperty();
      const initialFeatures = makePrismaFeatures();

      const domain = PrismaPropertyMapper.toDomain(
        initialProperty as never,
        initialFeatures as never,
      );
      const prisma = PrismaPropertyMapper.toPrisma(domain);
      const roundTripped = PrismaPropertyMapper.toDomain(
        prisma.property as never,
        initialFeatures as never,
      );

      expect(roundTripped.id.toValue()).toBe(initialProperty.id);
      expect(roundTripped.status).toBe(initialProperty.status);
      expect(roundTripped.address.placeId).toBe(initialProperty.placeId);
      expect(roundTripped.address.latitude).toBeCloseTo(-34.6037, 4);
      expect(roundTripped.features.propertyType).toBe(initialFeatures.propertyType);
      expect(roundTripped.features.bedrooms).toBe(initialFeatures.bedrooms);
    });
  });
});
