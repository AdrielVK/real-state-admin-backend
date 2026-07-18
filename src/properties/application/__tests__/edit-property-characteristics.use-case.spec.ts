import { DomainException, type IDomainEventPublisher } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { Property } from '../../domain/entities/property.aggregate';
import { CharacteristicCategory } from '../../domain/enums/characteristic-category.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../../domain/value-objects/property-characteristic.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import {
  EditPropertyCharacteristicsCommand,
  EditPropertyCharacteristicsUseCase,
} from '../commands/edit-property-characteristics.use-case';
import type { EditPropertyCharacteristicsDto } from '../dto/edit-property-characteristics.dto';

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
    internalCode: 'PROP-CHARS-1',
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
    characteristics: [
      PropertyCharacteristicValue.fromPersistence(
        1,
        'Piscina',
        'piscina',
        CharacteristicCategory.AMENIDAD,
      ),
      PropertyCharacteristicValue.fromPersistence(
        2,
        'Seguridad',
        'seguridad',
        CharacteristicCategory.SERVICIO,
      ),
    ],
    createdByUserId: 'user-uuid-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  });
}

function makeDto(): EditPropertyCharacteristicsDto {
  return {
    add: [{ name: 'Solarium', slug: 'solarium', category: CharacteristicCategory.AMENIDAD }],
    remove: [{ slug: 'piscina', category: CharacteristicCategory.AMENIDAD }],
  };
}

describe('EditPropertyCharacteristicsUseCase', () => {
  it('should add and remove characteristics, save the aggregate, and publish the event', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyCharacteristicsUseCase(repo, eventPublisher);

    const result = await useCase.execute(
      new EditPropertyCharacteristicsCommand('550e8400-e29b-41d4-a716-446655440000', makeDto()),
    );

    expect(result).toBe(property);
    // piscina was removed, solarium was added
    const slugs = property.characteristics.map((c) => `${c.slug}:${c.category}`);
    expect(slugs).toEqual(['seguridad:servicio', 'solarium:amenidad']);
    // Persisted
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(property);
    // Event was published
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventPublisher.publish.mock.calls[0]?.[0] as {
      eventName: string;
      propertyId: string;
      added: Array<{ slug: string; category: CharacteristicCategory }>;
      removed: Array<{ slug: string; category: CharacteristicCategory }>;
      changedAt: Date;
    };
    expect(publishedEvent.eventName).toBe('property.characteristics-updated');
    expect(publishedEvent.propertyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(publishedEvent.added).toEqual([
      { slug: 'solarium', category: CharacteristicCategory.AMENIDAD },
    ]);
    expect(publishedEvent.removed).toEqual([
      { slug: 'piscina', category: CharacteristicCategory.AMENIDAD },
    ]);
    expect(publishedEvent.changedAt).toBeInstanceOf(Date);
  });

  it('should throw NOT_FOUND when the property does not exist', async () => {
    const repo = makeRepository();
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyCharacteristicsUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyCharacteristicsCommand('00000000-0000-4000-8000-000000000000', makeDto()),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should throw NOT_FOUND when the property is soft-deleted (filtered by findById)', async () => {
    const repo = makeRepository();
    repo.findById.mockResolvedValue(null);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyCharacteristicsUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyCharacteristicsCommand('550e8400-e29b-41d4-a716-446655440000', makeDto()),
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('should propagate DomainException when remove targets a non-existent characteristic', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyCharacteristicsUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyCharacteristicsCommand('550e8400-e29b-41d4-a716-446655440000', {
          remove: [{ slug: 'inexistente', category: CharacteristicCategory.AMENIDAD }],
        }),
      ),
    ).rejects.toThrow(/no existe/i);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should propagate DomainException when add contains duplicates', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyCharacteristicsUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyCharacteristicsCommand('550e8400-e29b-41d4-a716-446655440000', {
          add: [
            { name: 'Wifi A', slug: 'wifi', category: CharacteristicCategory.SERVICIO },
            { name: 'Wifi B', slug: 'wifi', category: CharacteristicCategory.SERVICIO },
          ],
        }),
      ),
    ).rejects.toThrow(/duplicad/i);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should throw a DomainException when both add and remove are empty', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyCharacteristicsUseCase(repo, eventPublisher);

    await expect(
      useCase.execute(
        new EditPropertyCharacteristicsCommand('550e8400-e29b-41d4-a716-446655440000', {
          add: [],
          remove: [],
        }),
      ),
    ).rejects.toThrow(DomainException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should map add DTOs to PropertyCharacteristicValue VOs (slug normalized via fromCreate)', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty();
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const useCase = new EditPropertyCharacteristicsUseCase(repo, eventPublisher);

    await useCase.execute(
      new EditPropertyCharacteristicsCommand('550e8400-e29b-41d4-a716-446655440000', {
        add: [
          {
            name: 'Solarium',
            slug: '  SOLAR Lum  ',
            category: CharacteristicCategory.AMENIDAD,
          },
        ],
      }),
    );

    const solarium = property.characteristics.find((c) => c.slug === 'solar-lum');
    expect(solarium).toBeDefined();
    expect(solarium!.name).toBe('Solarium');
    expect(solarium!.category).toBe(CharacteristicCategory.AMENIDAD);
  });
});
