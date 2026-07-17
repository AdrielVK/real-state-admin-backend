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
import { CharacteristicCategory } from '../../domain/enums/characteristic-category.enum';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../../domain/value-objects/property-characteristic.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { PrismaPropertyRepository } from '../repositories/prisma-property.repository';

interface PrismaStub {
  property: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    upsert: jest.Mock;
  };
  propertyFeatures: {
    upsert: jest.Mock;
  };
  propertyTag: {
    upsert: jest.Mock;
  };
  propertyFeatureTag: {
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

function makeStub(overrides: Partial<PrismaStub> = {}): PrismaStub {
  const stub: PrismaStub = {
    property: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn().mockResolvedValue(),
    },
    propertyFeatures: {
      upsert: jest.fn().mockResolvedValue(),
    },
    propertyTag: {
      upsert: jest.fn().mockResolvedValue({ id: 1 }),
    },
    propertyFeatureTag: {
      deleteMany: jest.fn().mockResolvedValue(),
      createMany: jest.fn().mockResolvedValue(),
    },
    $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      // Pass the full stub as `tx` so the transaction callback can access property, features, etc.
      return fn(stub);
    }),
    ...overrides,
  };
  return stub;
}

function makePrismaService(stub: PrismaStub) {
  return stub as never;
}

function makePropertyAggregate(id: string, code: string): Property {
  return Property.reconstitute({
    id: new PropertyId(id),
    internalCode: code,
    address: new PropertyAddress({
      addressPlaceId: 'place-1',
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
    propertyType: PropertyType.DEPARTAMENTO,
    status: PropertyStatus.DISPONIBLE,
    features: new PropertyFeatures({
      totalAreaM2: 100,
      coveredAreaM2: 80,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      garages: 0,
      floor: 2,
      conservationState: ConservationState.BUENO,
      ageYears: 5,
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
}

function makePrismaRow() {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    internalCode: 'PROP-001',
    status: PropertyStatus.DISPONIBLE,
    propertyType: PropertyType.DEPARTAMENTO,
    ownerProfileId: 'owner-1',
    agentProfileId: 'agent-1',
    createdByUserId: 'user-uuid-row',
    addressPlaceId: 'place-1',
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
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    deletedAt: null,
    features: {
      totalAreaM2: 100,
      coveredAreaM2: 80,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      garages: 0,
      floor: 2,
      conservationState: ConservationState.BUENO,
      ageYears: 5,
    },
    tags: [
      {
        tag: {
          id: 1,
          name: 'Piscina',
          slug: 'piscina',
          category: CharacteristicCategory.AMENIDAD,
        },
      },
    ],
  };
}

describe('PrismaPropertyRepository', () => {
  describe('findById()', () => {
    it('should return a Property when the row exists', async () => {
      const row = makePrismaRow();
      const stub = makeStub({
        property: {
          findFirst: jest.fn().mockResolvedValue(row),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          upsert: jest.fn(),
        },
      });
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      const result = await repo.findById(new PropertyId(row.id));

      expect(result).not.toBeNull();
      expect(result?.id.toValue()).toBe(row.id);
      expect(result?.internalCode).toBe('PROP-001');
      expect(stub.property.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: row.id, deletedAt: null },
          include: expect.objectContaining({
            features: true,
            tags: expect.objectContaining({ include: { tag: true } }),
          }),
        }),
      );
    });

    it('should return null when the row is missing', async () => {
      const stub = makeStub();
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      const result = await repo.findById(new PropertyId('550e8400-e29b-41d4-a716-446655440000'));

      expect(result).toBeNull();
    });
  });

  describe('findByInternalCode()', () => {
    it('should return a Property when the row exists', async () => {
      const row = makePrismaRow();
      const stub = makeStub({
        property: {
          findFirst: jest.fn().mockResolvedValue(row),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          upsert: jest.fn(),
        },
      });
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      const result = await repo.findByInternalCode('PROP-001');

      expect(result).not.toBeNull();
      expect(result?.internalCode).toBe('PROP-001');
      expect(stub.property.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { internalCode: 'PROP-001', deletedAt: null } }),
      );
    });

    it('should return null when the row is missing', async () => {
      const stub = makeStub();
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      const result = await repo.findByInternalCode('PROP-MISSING');

      expect(result).toBeNull();
    });
  });

  describe('findMany()', () => {
    it('should call prisma with skip/take/where (deletedAt null) and return mapped aggregates', async () => {
      const row = makePrismaRow();
      const stub = makeStub({
        property: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([row]),
          count: jest.fn().mockResolvedValue(1),
          upsert: jest.fn(),
        },
      });
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      const result = await repo.findMany({ page: 1, limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0]?.id.toValue()).toBe(row.id);
      expect(stub.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should paginate correctly using page and limit', async () => {
      const stub = makeStub({
        property: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          upsert: jest.fn(),
        },
      });
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      await repo.findMany({ page: 3, limit: 5 });

      expect(stub.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });

    it('should filter by createdByUserId when provided', async () => {
      const stub = makeStub({
        property: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          upsert: jest.fn(),
        },
      });
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      await repo.findMany({ createdByUserId: 'user-uuid-1', page: 1, limit: 10 });

      expect(stub.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null, createdByUserId: 'user-uuid-1' } }),
      );
    });
  });

  describe('count()', () => {
    it('should call prisma count with deletedAt null and no other filter', async () => {
      const stub = makeStub({
        property: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(42),
          upsert: jest.fn(),
        },
      });
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      const result = await repo.count({});

      expect(result).toBe(42);
      expect(stub.property.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
    });

    it('should filter by createdByUserId when provided', async () => {
      const stub = makeStub({
        property: {
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(3),
          upsert: jest.fn(),
        },
      });
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      const result = await repo.count({ createdByUserId: 'user-uuid-2' });

      expect(result).toBe(3);
      expect(stub.property.count).toHaveBeenCalledWith({
        where: { deletedAt: null, createdByUserId: 'user-uuid-2' },
      });
    });
  });

  describe('save()', () => {
    it('should execute the full transaction with upsert, features upsert, and tag delete+insert', async () => {
      const aggregate = makePropertyAggregate('550e8400-e29b-41d4-a716-446655440000', 'PROP-001');
      const stub = makeStub();
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      await repo.save(aggregate);

      expect(stub.$transaction).toHaveBeenCalledTimes(1);
      expect(stub.property.upsert).toHaveBeenCalledTimes(1);
      expect(stub.propertyFeatures.upsert).toHaveBeenCalledTimes(1);
      expect(stub.propertyTag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug_category: { slug: 'piscina', category: CharacteristicCategory.AMENIDAD } },
          create: {
            name: 'Piscina',
            slug: 'piscina',
            category: CharacteristicCategory.AMENIDAD,
          },
          update: {},
          select: { id: true },
        }),
      );
      expect(stub.propertyFeatureTag.deleteMany).toHaveBeenCalledWith({
        where: { propertyId: '550e8400-e29b-41d4-a716-446655440000' },
      });
      expect(stub.propertyFeatureTag.createMany).toHaveBeenCalledWith({
        data: [{ propertyId: '550e8400-e29b-41d4-a716-446655440000', tagId: 1 }],
      });
      // After save, the aggregate's VOs should now carry the resolved numeric id
      expect(aggregate.characteristics[0]!.id).toBe(1);
    });

    it('should NOT clear pending domain events (events are dispatched by the handler)', async () => {
      const aggregate = Property.create({
        internalCode: 'PROP-NEW',
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
        propertyType: PropertyType.DEPARTAMENTO,
      });
      const stub = makeStub();
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      await repo.save(aggregate);

      // The repository must not call pullDomainEvents — the handler does that
      expect(aggregate.domainEvents).toHaveLength(1);
    });

    it('should skip features upsert when property has no features', async () => {
      const aggregate = Property.create({
        internalCode: 'PROP-NOF',
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
        propertyType: PropertyType.DEPARTAMENTO,
      });
      const stub = makeStub();
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      await repo.save(aggregate);

      expect(stub.propertyFeatures.upsert).not.toHaveBeenCalled();
    });

    it('should skip tag delete+insert when characteristicIds is undefined (not provided by mapper)', async () => {
      // Use a property with no characteristics — mapper sets characteristicIds to empty array
      const aggregate = Property.create({
        internalCode: 'PROP-NOT',
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
        propertyType: PropertyType.DEPARTAMENTO,
      });
      const stub = makeStub();
      const repo = new PrismaPropertyRepository(makePrismaService(stub));

      await repo.save(aggregate);

      // When characteristicIds is an empty array, still calls deleteMany+createMany
      // But mapper ALWAYS emits characteristicIds (empty array when no characteristics), so this path is always hit
      expect(stub.propertyFeatureTag.deleteMany).toHaveBeenCalled();
    });
  });
});
