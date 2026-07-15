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
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { PropertyInternalId } from '../../domain/value-objects/property-internal-id.value-object';
import { PrismaPropertyRepository } from '../repositories/prisma-property.repository';

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
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
  features?: PrismaFeaturesRecord | null;
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
  serviceTags: string[];
  amenityTags: string[];
  conditionTags: string[];
  extraFeatures: Record<string, unknown>;
}

function makePrismaPropertyRecord(
  overrides: Partial<PrismaPropertyRecord> = {},
): PrismaPropertyRecord {
  const featuresRecord: PrismaFeaturesRecord = {
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
  };
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
    features: featuresRecord,
    ...overrides,
  };
}

function createMockPrismaService() {
  return {
    property: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
}

function makeProperty(): Property {
  const address = new PropertyAddress({
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
  });
  const features = PropertyFeatures.create({
    propertyType: PropertyType.DEPARTAMENTO,
    conservationState: ConservationState.BUENO,
    bedrooms: 2,
    bathrooms: 1,
  });
  return Property.create(address, features, PropertyInternalId.create('ABC1234'));
}

describe('PrismaPropertyRepository', () => {
  let repository: PrismaPropertyRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    repository = new PrismaPropertyRepository(mockPrisma as never);
  });

  describe('findById()', () => {
    it('should return null when no property exists', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      const result = await repository.findById(new PropertyId(VALID_UUID));
      expect(result).toBeNull();
      expect(mockPrisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: VALID_UUID },
        include: { features: true },
      });
    });

    it('should return a Property aggregate when found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(makePrismaPropertyRecord());
      const result = await repository.findById(new PropertyId(VALID_UUID));
      expect(result).toBeInstanceOf(Property);
      expect(result!.id.toValue()).toBe(VALID_UUID);
      expect(result!.address.placeId).toBe('place-123');
      expect(result!.features.propertyType).toBe(PropertyType.DEPARTAMENTO);
    });

    it('should return a Property with no pending domain events', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(makePrismaPropertyRecord());
      const result = await repository.findById(new PropertyId(VALID_UUID));
      expect(result!.domainEvents).toHaveLength(0);
    });
  });

  describe('findByInternalId()', () => {
    it('should return null when no property exists for the internalId', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(null);
      const result = await repository.findByInternalId(PropertyInternalId.create('ABC1234'));
      expect(result).toBeNull();
      expect(mockPrisma.property.findUnique).toHaveBeenCalledWith({
        where: { internalId: 'ABC1234' },
        include: { features: true },
      });
    });

    it('should return a Property aggregate when found', async () => {
      mockPrisma.property.findUnique.mockResolvedValue(makePrismaPropertyRecord());
      const result = await repository.findByInternalId(PropertyInternalId.create('ABC1234'));
      expect(result).toBeInstanceOf(Property);
      expect(result!.internalId?.value).toBe('ABC1234');
    });
  });

  describe('save()', () => {
    it('should call prisma.property.upsert with id as the unique key', async () => {
      mockPrisma.property.upsert.mockResolvedValue(makePrismaPropertyRecord());
      const property = makeProperty();
      await repository.save(property);
      expect(mockPrisma.property.upsert).toHaveBeenCalledTimes(1);
      const call = mockPrisma.property.upsert.mock.calls[0]?.[0] as {
        where: { id: string };
        create: { id: string; features: { create: unknown } };
      };
      expect(call.where).toEqual({ id: property.id.toValue() });
      expect(call.create.id).toBe(property.id.toValue());
      expect(call.create.features.create).toBeDefined();
    });

    it('should return the same aggregate instance after save', async () => {
      mockPrisma.property.upsert.mockResolvedValue(makePrismaPropertyRecord());
      const property = makeProperty();
      const result = await repository.save(property);
      expect(result).toBe(property);
    });

    it('should clear pending domain events on the aggregate after save', async () => {
      mockPrisma.property.upsert.mockResolvedValue(makePrismaPropertyRecord());
      const property = makeProperty();
      // Property.create() emits a PropertyCreatedEvent
      expect(property.domainEvents).toHaveLength(1);
      await repository.save(property);
      expect(property.domainEvents).toHaveLength(0);
    });

    it('should throw DomainException DUPLICATE_INTERNAL_ID on unique constraint violation', async () => {
      const prismaError = new Error('Unique constraint failed on the fields: (`internal_id`)');
      mockPrisma.property.upsert.mockRejectedValue(prismaError);
      const property = makeProperty();

      await expect(repository.save(property)).rejects.toThrow(
        'Ya existe una propiedad con ese internalId',
      );
    });

    it('should rethrow non-duplicate errors', async () => {
      const prismaError = new Error('Connection lost');
      mockPrisma.property.upsert.mockRejectedValue(prismaError);
      const property = makeProperty();
      await expect(repository.save(property)).rejects.toThrow('Connection lost');
    });
  });
});
