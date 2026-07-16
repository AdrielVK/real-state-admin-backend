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

import type { IDomainEventPublisher } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { Property } from '../../domain/entities/property.aggregate';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { DeletePropertyCommand, DeletePropertyUseCase } from '../commands/delete-property.use-case';

function makeRepository(): jest.Mocked<IPropertyRepository> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findByInternalCode: jest.fn(),
    save: jest.fn().mockResolvedValue(),
  };
}

function makeEventPublisher(): jest.Mocked<IDomainEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IDomainEventPublisher>;
}

function makeProperty(): Property {
  return Property.reconstitute({
    id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
    internalCode: 'PROP-001',
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
    features: null,
    ownerProfileId: null,
    agentProfileId: null,
    characteristics: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

describe('DeletePropertyUseCase', () => {
  it('should soft-delete an existing property and dispatch the event', async () => {
    const repo = makeRepository();
    const property = makeProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new DeletePropertyUseCase(repo, eventPublisher);

    await useCase.execute(new DeletePropertyCommand('550e8400-e29b-41d4-a716-446655440000'));

    expect(property.deletedAt).not.toBeNull();
    expect(repo.save).toHaveBeenCalledWith(property);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'property.deleted' }),
    );
  });

  it('should throw NOT_FOUND when the property does not exist', async () => {
    const repo = makeRepository();
    const useCase = new DeletePropertyUseCase(repo, makeEventPublisher());

    await expect(
      useCase.execute(new DeletePropertyCommand('00000000-0000-4000-8000-000000000000')),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('should be idempotent — calling delete twice only publishes one event', async () => {
    const repo = makeRepository();
    const property = makeProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new DeletePropertyUseCase(repo, eventPublisher);

    await useCase.execute(new DeletePropertyCommand('550e8400-e29b-41d4-a716-446655440000'));
    await useCase.execute(new DeletePropertyCommand('550e8400-e29b-41d4-a716-446655440000'));

    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });
});
