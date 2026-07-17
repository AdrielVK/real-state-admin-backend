import { Property } from '../../domain/entities/property.aggregate';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { ListAllPropertiesUseCase } from '../queries/list-all-properties.use-case';

function makeProperty(id: string): Property {
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
    createdByUserId: null,
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

describe('ListAllPropertiesUseCase', () => {
  it('should call repository.findMany with page/limit and no createdByUserId filter', async () => {
    const properties = [makeProperty('11111111-1111-4111-8111-111111111111')];
    const repo = makeRepository({
      findMany: jest.fn().mockResolvedValue(properties),
      count: jest.fn().mockResolvedValue(1),
    });
    const useCase = new ListAllPropertiesUseCase(repo);

    await useCase.execute({ page: 1, limit: 10 });

    expect(repo.findMany).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('should compute meta.page, meta.limit, meta.total, meta.totalPages correctly', async () => {
    const properties = [
      makeProperty('11111111-1111-4111-8111-111111111111'),
      makeProperty('22222222-2222-4222-8222-222222222222'),
    ];
    const repo = makeRepository({
      findMany: jest.fn().mockResolvedValue(properties),
      count: jest.fn().mockResolvedValue(25),
    });
    const useCase = new ListAllPropertiesUseCase(repo);

    const result = await useCase.execute({ page: 2, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
  });

  it('should return empty data and meta.total=0 when no properties exist', async () => {
    const repo = makeRepository({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    const useCase = new ListAllPropertiesUseCase(repo);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.data).toEqual([]);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });
});
