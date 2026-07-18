import type { IDomainEventPublisher } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { Property } from '../../domain/entities/property.aggregate';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import {
  EditPropertyFeaturesCommand,
  EditPropertyFeaturesUseCase,
} from '../commands/edit-property-features.use-case';
import type { EditPropertyFeaturesDto } from '../dto/edit-property-features.dto';

function makeRepository(): jest.Mocked<IPropertyRepository> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findByInternalCode: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    save: jest.fn().mockResolvedValue(),
  };
}

function makeEventPublisher(): jest.Mocked<IDomainEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IDomainEventPublisher>;
}

function makePropertyWithFeatures(): Property {
  return Property.reconstitute({
    id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
    internalCode: 'PROP-001',
    address: new PropertyAddress({
      addressPlaceId: 'place-1',
      addressFormatted: 'Av. Corrientes 1234',
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
    characteristics: [],
    createdByUserId: 'user-uuid-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  });
}

function makePropertyWithoutFeatures(): Property {
  return Property.reconstitute({
    id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
    internalCode: 'PROP-002',
    address: new PropertyAddress({
      addressPlaceId: 'place-1',
      addressFormatted: 'Av. Corrientes 1234',
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
    features: null,
    ownerProfileId: null,
    agentProfileId: null,
    characteristics: [],
    createdByUserId: 'user-uuid-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  });
}

describe('EditPropertyFeaturesUseCase', () => {
  it('should load, merge, save, and publish the features-updated event', async () => {
    const repo = makeRepository();
    const property = makePropertyWithFeatures();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyFeaturesUseCase(repo, eventPublisher);

    const dto: EditPropertyFeaturesDto = { bedrooms: 4 } as EditPropertyFeaturesDto;

    const result = await useCase.execute(
      new EditPropertyFeaturesCommand('550e8400-e29b-41d4-a716-446655440000', dto),
    );

    expect(result).toBe(property);
    expect(result.features!.bedrooms).toBe(4);
    // Other fields preserved
    expect(result.features!.totalAreaM2).toBe(100);
    expect(result.features!.rooms).toBe(3);
    expect(result.features!.bathrooms).toBe(1);
    expect(result.features!.conservationState).toBe(ConservationState.BUENO);

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(property);

    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventPublisher.publish.mock.calls[0]?.[0] as {
      eventName: string;
      propertyId: string;
      oldFeatures: { totalAreaM2: number; bedrooms: number } | null;
      newFeatures: { totalAreaM2: number; bedrooms: number };
    };
    expect(publishedEvent.eventName).toBe('property.features-updated');
    expect(publishedEvent.propertyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(publishedEvent.oldFeatures?.bedrooms).toBe(2);
    expect(publishedEvent.newFeatures.bedrooms).toBe(4);
    expect(publishedEvent.newFeatures.totalAreaM2).toBe(100);
  });

  it('should clear a field when the DTO sends null', async () => {
    const repo = makeRepository();
    const property = makePropertyWithFeatures();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyFeaturesUseCase(repo, eventPublisher);

    const dto: EditPropertyFeaturesDto = { bedrooms: null } as EditPropertyFeaturesDto;

    const result = await useCase.execute(
      new EditPropertyFeaturesCommand('550e8400-e29b-41d4-a716-446655440000', dto),
    );

    expect(result.features!.bedrooms).toBeNull();
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('should create features from null when mandatory fields are provided', async () => {
    const repo = makeRepository();
    const property = makePropertyWithoutFeatures();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyFeaturesUseCase(repo, eventPublisher);

    const dto: EditPropertyFeaturesDto = {
      totalAreaM2: 120,
      coveredAreaM2: 90,
      conservationState: ConservationState.EXCELENTE,
    } as EditPropertyFeaturesDto;

    const result = await useCase.execute(
      new EditPropertyFeaturesCommand('550e8400-e29b-41d4-a716-446655440000', dto),
    );

    expect(result.features).not.toBeNull();
    expect(result.features!.totalAreaM2).toBe(120);
    expect(result.features!.coveredAreaM2).toBe(90);
    expect(result.features!.conservationState).toBe(ConservationState.EXCELENTE);
    expect(result.features!.rooms).toBeNull();

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventPublisher.publish.mock.calls[0]?.[0] as {
      oldFeatures: unknown;
    };
    expect(publishedEvent.oldFeatures).toBeNull();
  });

  it('should throw NOT_FOUND when the property does not exist', async () => {
    const repo = makeRepository();
    const useCase = new EditPropertyFeaturesUseCase(repo, makeEventPublisher());

    await expect(
      useCase.execute(
        new EditPropertyFeaturesCommand('00000000-0000-4000-8000-000000000000', {
          bedrooms: 3,
        } as EditPropertyFeaturesDto),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should throw NOT_FOUND when the property is soft-deleted (filtered by findById)', async () => {
    const repo = makeRepository();
    repo.findById.mockResolvedValue(null);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyFeaturesUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyFeaturesCommand('550e8400-e29b-41d4-a716-446655440000', {
          bedrooms: 3,
        } as EditPropertyFeaturesDto),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should propagate a DomainException when first-creation omits a mandatory field', async () => {
    const repo = makeRepository();
    const property = makePropertyWithoutFeatures();
    repo.findById.mockResolvedValue(property);
    const useCase = new EditPropertyFeaturesUseCase(repo, makeEventPublisher());

    await expect(
      useCase.execute(
        new EditPropertyFeaturesCommand('550e8400-e29b-41d4-a716-446655440000', {
          bedrooms: 3,
        } as EditPropertyFeaturesDto),
      ),
    ).rejects.toThrow(/obligatorio/i);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should propagate a DomainException when the new payload has a negative totalAreaM2', async () => {
    const repo = makeRepository();
    const property = makePropertyWithFeatures();
    repo.findById.mockResolvedValue(property);
    const useCase = new EditPropertyFeaturesUseCase(repo, makeEventPublisher());

    await expect(
      useCase.execute(
        new EditPropertyFeaturesCommand('550e8400-e29b-41d4-a716-446655440000', {
          totalAreaM2: -10,
        } as EditPropertyFeaturesDto),
      ),
    ).rejects.toThrow(/positivo/i);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should not emit an event when the merged features equal the existing ones (idempotent)', async () => {
    const repo = makeRepository();
    const property = makePropertyWithFeatures();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyFeaturesUseCase(repo, eventPublisher);

    // Send a payload that, after merge, yields the same features.
    const result = await useCase.execute(
      new EditPropertyFeaturesCommand('550e8400-e29b-41d4-a716-446655440000', {
        totalAreaM2: 100,
      } as EditPropertyFeaturesDto),
    );

    expect(result.features!.totalAreaM2).toBe(100);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
