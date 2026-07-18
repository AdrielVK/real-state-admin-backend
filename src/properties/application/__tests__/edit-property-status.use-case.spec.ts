import { DomainException, type IDomainEventPublisher } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { Property } from '../../domain/entities/property.aggregate';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import {
  EditPropertyStatusCommand,
  EditPropertyStatusUseCase,
} from '../commands/edit-property-status.use-case';

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

function makeExistingProperty(): Property {
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

describe('EditPropertyStatusUseCase', () => {
  it('should load, update, save, and publish the status-changed event', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyStatusUseCase(repo, eventPublisher);

    const result = await useCase.execute(
      new EditPropertyStatusCommand('550e8400-e29b-41d4-a716-446655440000', {
        status: PropertyStatus.VENDIDA,
      }),
    );

    expect(result).toBe(property);
    // Status is the new one
    expect(result.status).toBe(PropertyStatus.VENDIDA);
    // Persistence was called with the same property
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(property);
    // Event was published with the right name, property id, and status snapshots.
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventPublisher.publish.mock.calls[0]?.[0] as {
      eventName: string;
      propertyId: string;
      oldStatus: PropertyStatus;
      newStatus: PropertyStatus;
    };
    expect(publishedEvent.eventName).toBe('property.status-changed');
    expect(publishedEvent.propertyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(publishedEvent.oldStatus).toBe(PropertyStatus.DISPONIBLE);
    expect(publishedEvent.newStatus).toBe(PropertyStatus.VENDIDA);
  });

  it('should throw NOT_FOUND when the property does not exist', async () => {
    const repo = makeRepository();
    const useCase = new EditPropertyStatusUseCase(repo, makeEventPublisher());

    await expect(
      useCase.execute(
        new EditPropertyStatusCommand('00000000-0000-4000-8000-000000000000', {
          status: PropertyStatus.VENDIDA,
        }),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should throw NOT_FOUND when the property is soft-deleted (filtered by findById)', async () => {
    const repo = makeRepository();
    // findById already returns null for soft-deleted rows because of the
    // `deletedAt: null` predicate enforced by the repository implementation.
    repo.findById.mockResolvedValue(null);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyStatusUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyStatusCommand('550e8400-e29b-41d4-a716-446655440000', {
          status: PropertyStatus.VENDIDA,
        }),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should throw a DomainException when the new status equals the existing one', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyStatusUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyStatusCommand('550e8400-e29b-41d4-a716-446655440000', {
          status: PropertyStatus.DISPONIBLE,
        }),
      ),
    ).rejects.toThrow(DomainException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should throw a DomainException when the status value is not a valid PropertyStatus', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyStatusUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyStatusCommand('550e8400-e29b-41d4-a716-446655440000', {
          status: 'estado_invalido' as PropertyStatus,
        }),
      ),
    ).rejects.toThrow(DomainException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
