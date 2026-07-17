import type { IDomainEventPublisher } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { Property } from '../../domain/entities/property.aggregate';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import {
  EditPropertyAddressCommand,
  EditPropertyAddressUseCase,
} from '../commands/edit-property-address.use-case';
import type { EditPropertyAddressDto } from '../dto/edit-property-address.dto';

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

function makeDto(): EditPropertyAddressDto {
  return {
    addressPlaceId: 'place-2',
    addressFormatted: 'Av. Santa Fe 2500',
    addressStreet: 'Av. Santa Fe',
    addressStreetNumber: '2500',
    addressNeighborhood: 'Palermo',
    addressCity: 'CABA',
    addressState: 'Buenos Aires',
    addressCountry: 'Argentina',
    addressPostalCode: 'C1425',
    addressLatitude: -34.595,
    addressLongitude: -58.397,
  };
}

describe('EditPropertyAddressUseCase', () => {
  it('should load, update, save, and publish the address-changed event', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyAddressUseCase(repo, eventPublisher);

    const result = await useCase.execute(
      new EditPropertyAddressCommand('550e8400-e29b-41d4-a716-446655440000', makeDto()),
    );

    expect(result).toBe(property);
    // Address is the new one
    expect(result.address.addressFormatted).toBe('Av. Santa Fe 2500');
    expect(result.address.addressCity).toBe('CABA');
    expect(result.address.addressPlaceId).toBe('place-2');
    // Persistence was called with the same property
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(property);
    // Event was published with the right name, property id, and snapshots.
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventPublisher.publish.mock.calls[0]?.[0] as {
      eventName: string;
      propertyId: string;
      newAddress: { addressFormatted: string };
      oldAddress: { addressFormatted: string };
    };
    expect(publishedEvent.eventName).toBe('property.address-changed');
    expect(publishedEvent.propertyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(publishedEvent.newAddress.addressFormatted).toBe('Av. Santa Fe 2500');
    expect(publishedEvent.oldAddress.addressFormatted).toBe('Av. Corrientes 1234');
  });

  it('should throw NOT_FOUND when the property does not exist', async () => {
    const repo = makeRepository();
    const useCase = new EditPropertyAddressUseCase(repo, makeEventPublisher());

    await expect(
      useCase.execute(
        new EditPropertyAddressCommand('00000000-0000-4000-8000-000000000000', makeDto()),
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
    const useCase = new EditPropertyAddressUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyAddressCommand('550e8400-e29b-41d4-a716-446655440000', makeDto()),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should not emit an event when the new address equals the existing one', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyAddressUseCase(repo, eventPublisher);

    // Send a DTO that builds the same address as the existing one.
    const sameDto: EditPropertyAddressDto = {
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
    };

    const result = await useCase.execute(
      new EditPropertyAddressCommand('550e8400-e29b-41d4-a716-446655440000', sameDto),
    );

    expect(result.address.addressFormatted).toBe('Av. Corrientes 1234');
    // The aggregate was still saved (cheap idempotent write).
    expect(repo.save).toHaveBeenCalledTimes(1);
    // But no event was published because the address did not change.
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
