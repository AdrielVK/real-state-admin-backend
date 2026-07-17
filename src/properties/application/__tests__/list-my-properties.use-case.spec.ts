import { Property } from '../../domain/entities/property.aggregate';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { ListMyPropertiesUseCase } from '../queries/list-my-properties.use-case';

function makeProperty(id: string, createdByUserId: string | null): Property {
  return Property.reconstitute({
    id: new PropertyId(id),
    internalCode: `PROP-${id}`,
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
    ownerProfileId: null,
    agentProfileId: null,
    createdByUserId,
    characteristics: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  });
}

function makeRepository(overrides: Partial<IPropertyRepository> = {}): IPropertyRepository {
  return {
    findById: jest.fn(),
    findByInternalCode: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    save: jest.fn(),
    ...overrides,
  } as IPropertyRepository;
}

describe('ListMyPropertiesUseCase', () => {
  it('should call repository.findMany with the userId as createdByUserId', async () => {
    const repo = makeRepository({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    const useCase = new ListMyPropertiesUseCase(repo);

    await useCase.execute({ createdByUserId: 'user-uuid-1', page: 1, limit: 10 });

    expect(repo.findMany).toHaveBeenCalledWith({
      createdByUserId: 'user-uuid-1',
      page: 1,
      limit: 10,
    });
  });

  it('should call repository.count with the userId as createdByUserId', async () => {
    const repo = makeRepository({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    const useCase = new ListMyPropertiesUseCase(repo);

    await useCase.execute({ createdByUserId: 'user-uuid-1', page: 1, limit: 10 });

    expect(repo.count).toHaveBeenCalledWith({ createdByUserId: 'user-uuid-1' });
  });

  it('should return paginated data and meta for the given user', async () => {
    const properties = [makeProperty('11111111-1111-4111-8111-111111111111', 'user-uuid-1')];
    const repo = makeRepository({
      findMany: jest.fn().mockResolvedValue(properties),
      count: jest.fn().mockResolvedValue(1),
    });
    const useCase = new ListMyPropertiesUseCase(repo);

    const result = await useCase.execute({ createdByUserId: 'user-uuid-1', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.createdByUserId).toBe('user-uuid-1');
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it('should return empty data and meta.total=0 when the user has no properties', async () => {
    const repo = makeRepository({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    const useCase = new ListMyPropertiesUseCase(repo);

    const result = await useCase.execute({ createdByUserId: 'user-no-props', page: 1, limit: 10 });

    expect(result.data).toEqual([]);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });
});
