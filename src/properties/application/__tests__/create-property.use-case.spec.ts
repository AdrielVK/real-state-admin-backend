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
import { CharacteristicCategory } from '../../domain/enums/characteristic-category.enum';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IProfileExistenceService } from '../../domain/ports/profile-existence.service';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { CreatePropertyCommand, CreatePropertyUseCase } from '../commands/create-property.use-case';
import type { CreatePropertyDto } from '../dto/create-property.dto';

function makeValidDto(): CreatePropertyDto {
  return {
    internalCode: 'PROP-001',
    propertyType: PropertyType.DEPARTAMENTO,
    status: PropertyStatus.DISPONIBLE,
    ownerProfileId: 'owner-1',
    agentProfileId: 'agent-1',
    address: {
      addressPlaceId: 'place-1',
      addressFormatted: 'Calle 1',
      addressStreet: 'Calle 1',
      addressStreetNumber: '100',
      addressNeighborhood: 'Centro',
      addressCity: 'CABA',
      addressState: 'Buenos Aires',
      addressCountry: 'Argentina',
      addressPostalCode: 'C1000',
      addressLatitude: -34.6037,
      addressLongitude: -58.3816,
    },
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
    characteristics: [
      {
        name: 'Piscina',
        slug: 'piscina',
        category: CharacteristicCategory.AMENIDAD,
      },
    ],
  };
}

function makeRepository(): jest.Mocked<IPropertyRepository> {
  return {
    findById: jest.fn(),
    findByInternalCode: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(),
  };
}

function makeEventPublisher(): jest.Mocked<IDomainEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IDomainEventPublisher>;
}

function makeProfileExistence(): jest.Mocked<IProfileExistenceService> {
  return {
    agentExists: jest.fn().mockResolvedValue(true),
    ownerExists: jest.fn().mockResolvedValue(true),
  };
}

describe('CreatePropertyUseCase', () => {
  it('should reject a property when internalCode already exists', async () => {
    const repo = makeRepository();
    repo.findByInternalCode.mockResolvedValueOnce(
      Property.reconstitute({
        id: { toValue: () => 'existing-id' } as never,
        internalCode: 'PROP-001',
        address: {} as never,
        propertyType: PropertyType.DEPARTAMENTO,
        status: PropertyStatus.DISPONIBLE,
        features: null,
        ownerProfileId: null,
        agentProfileId: null,
        characteristics: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    );
    const useCase = new CreatePropertyUseCase(repo, makeEventPublisher(), makeProfileExistence());

    await expect(useCase.execute(new CreatePropertyCommand(makeValidDto()))).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it('should build, persist, and dispatch domain events', async () => {
    const repo = makeRepository();
    const eventPublisher = makeEventPublisher();
    const useCase = new CreatePropertyUseCase(repo, eventPublisher, makeProfileExistence());

    const result = await useCase.execute(new CreatePropertyCommand(makeValidDto()));

    expect(result).toBeInstanceOf(Property);
    expect(result.internalCode).toBe('PROP-001');
    expect(result.propertyType).toBe(PropertyType.DEPARTAMENTO);
    expect(result.status).toBe(PropertyStatus.DISPONIBLE);
    expect(result.ownerProfileId).toBe('owner-1');
    expect(result.agentProfileId).toBe('agent-1');
    expect(result.characteristics).toHaveLength(1);
    expect(result.characteristics[0]?.id).toBeNull();
    expect(result.characteristics[0]?.slug).toBe('piscina');
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'property.created',
        propertyId: result.id.toValue(),
      }),
    );
  });

  it('should default status to DISPONIBLE when not provided', async () => {
    const dto = makeValidDto();
    delete dto.status;
    const useCase = new CreatePropertyUseCase(
      makeRepository(),
      makeEventPublisher(),
      makeProfileExistence(),
    );

    const result = await useCase.execute(new CreatePropertyCommand(dto));

    expect(result.status).toBe(PropertyStatus.DISPONIBLE);
  });

  it('should persist a property without features when the DTO omits them', async () => {
    const dto = makeValidDto();
    delete dto.features;
    const useCase = new CreatePropertyUseCase(
      makeRepository(),
      makeEventPublisher(),
      makeProfileExistence(),
    );

    const result = await useCase.execute(new CreatePropertyCommand(dto));

    expect(result.features).toBeNull();
  });

  it('should persist a property without characteristics when the DTO omits them', async () => {
    const dto = makeValidDto();
    delete dto.characteristics;
    const useCase = new CreatePropertyUseCase(
      makeRepository(),
      makeEventPublisher(),
      makeProfileExistence(),
    );

    const result = await useCase.execute(new CreatePropertyCommand(dto));

    expect(result.characteristics).toEqual([]);
  });

  it('should skip uniqueness check when internalCode is not provided', async () => {
    const dto = makeValidDto();
    delete dto.internalCode;
    const repo = makeRepository();
    const useCase = new CreatePropertyUseCase(repo, makeEventPublisher(), makeProfileExistence());

    await useCase.execute(new CreatePropertyCommand(dto));

    expect(repo.findByInternalCode).not.toHaveBeenCalled();
  });

  it('should reject when agentProfileId references a non-existent profile', async () => {
    const profiles = makeProfileExistence();
    profiles.agentExists.mockResolvedValue(false);
    const useCase = new CreatePropertyUseCase(makeRepository(), makeEventPublisher(), profiles);

    await expect(useCase.execute(new CreatePropertyCommand(makeValidDto()))).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it('should reject when ownerProfileId references a non-existent profile', async () => {
    const profiles = makeProfileExistence();
    profiles.ownerExists.mockResolvedValue(false);
    const useCase = new CreatePropertyUseCase(makeRepository(), makeEventPublisher(), profiles);

    await expect(useCase.execute(new CreatePropertyCommand(makeValidDto()))).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it('should skip profile validation when IDs are not provided', async () => {
    const dto = makeValidDto();
    delete dto.agentProfileId;
    delete dto.ownerProfileId;
    const profiles = makeProfileExistence();
    const useCase = new CreatePropertyUseCase(makeRepository(), makeEventPublisher(), profiles);

    await useCase.execute(new CreatePropertyCommand(dto));

    expect(profiles.agentExists).not.toHaveBeenCalled();
    expect(profiles.ownerExists).not.toHaveBeenCalled();
  });

  it('should reject with AppException when two characteristics share slug+category', async () => {
    const dto = makeValidDto();
    dto.characteristics = [
      { name: 'Piscina', slug: 'piscina', category: CharacteristicCategory.AMENIDAD },
      { name: 'Piscina 2', slug: 'piscina', category: CharacteristicCategory.AMENIDAD },
    ];
    const useCase = new CreatePropertyUseCase(
      makeRepository(),
      makeEventPublisher(),
      makeProfileExistence(),
    );

    await expect(useCase.execute(new CreatePropertyCommand(dto))).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it('should reject with the same slug in different categories (still distinct — both allowed)', async () => {
    const dto = makeValidDto();
    dto.characteristics = [
      { name: 'Piscina', slug: 'piscina', category: CharacteristicCategory.AMENIDAD },
      { name: 'Piscina', slug: 'piscina', category: CharacteristicCategory.SERVICIO },
    ];
    const useCase = new CreatePropertyUseCase(
      makeRepository(),
      makeEventPublisher(),
      makeProfileExistence(),
    );

    const result = await useCase.execute(new CreatePropertyCommand(dto));

    expect(result.characteristics).toHaveLength(2);
  });
});
