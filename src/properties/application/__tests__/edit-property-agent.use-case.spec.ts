import { DomainException, type IDomainEventPublisher } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { Property } from '../../domain/entities/property.aggregate';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IProfileExistenceService } from '../../domain/ports/profile-existence.service';
import type { IPropertyRepository } from '../../domain/repositories/property-repository.interface';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import {
  EditPropertyAgentCommand,
  EditPropertyAgentUseCase,
} from '../commands/edit-property-agent.use-case';

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

function makeProfileExistenceService(): jest.Mocked<IProfileExistenceService> {
  return {
    agentExists: jest.fn().mockResolvedValue(true),
    ownerExists: jest.fn().mockResolvedValue(true),
  } as jest.Mocked<IProfileExistenceService>;
}

function makeExistingProperty(agentProfileId: string | null = null): Property {
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
    status: 'disponible' as never,
    features: null,
    ownerProfileId: null,
    agentProfileId,
    characteristics: [],
    createdByUserId: 'user-uuid-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    deletedAt: null,
  });
}

describe('EditPropertyAgentUseCase', () => {
  it('should load, assign an agent, save, and publish the agent-changed event', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty(null);
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const profileExistence = makeProfileExistenceService();
    profileExistence.agentExists.mockResolvedValue(true);
    const useCase = new EditPropertyAgentUseCase(repo, eventPublisher, profileExistence);

    const result = await useCase.execute(
      new EditPropertyAgentCommand('550e8400-e29b-41d4-a716-446655440000', {
        agentProfileId: 'agent-uuid-1',
      }),
    );

    expect(result).toBe(property);
    expect(result.agentProfileId).toBe('agent-uuid-1');
    // Profile existence was checked with the supplied id
    expect(profileExistence.agentExists).toHaveBeenCalledTimes(1);
    expect(profileExistence.agentExists).toHaveBeenCalledWith('agent-uuid-1');
    // Persistence was called with the same property
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(property);
    // Event was published with the right name and snapshots
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventPublisher.publish.mock.calls[0]?.[0] as {
      eventName: string;
      propertyId: string;
      oldAgentId: string | null;
      newAgentId: string | null;
    };
    expect(publishedEvent.eventName).toBe('property.agent-changed');
    expect(publishedEvent.propertyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(publishedEvent.oldAgentId).toBeNull();
    expect(publishedEvent.newAgentId).toBe('agent-uuid-1');
  });

  it('should remove the agent when agentProfileId is null: save and publish event', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty('agent-uuid-prev');
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const profileExistence = makeProfileExistenceService();
    const useCase = new EditPropertyAgentUseCase(repo, eventPublisher, profileExistence);

    const result = await useCase.execute(
      new EditPropertyAgentCommand('550e8400-e29b-41d4-a716-446655440000', {
        agentProfileId: null,
      }),
    );

    expect(result).toBe(property);
    expect(result.agentProfileId).toBeNull();
    // No profile existence check when removing
    expect(profileExistence.agentExists).not.toHaveBeenCalled();
    // Persistence + event publication
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventPublisher.publish.mock.calls[0]?.[0] as {
      eventName: string;
      oldAgentId: string | null;
      newAgentId: string | null;
    };
    expect(publishedEvent.eventName).toBe('property.agent-changed');
    expect(publishedEvent.oldAgentId).toBe('agent-uuid-prev');
    expect(publishedEvent.newAgentId).toBeNull();
  });

  it('should throw NOT_FOUND when the property does not exist', async () => {
    const repo = makeRepository();
    const eventPublisher = makeEventPublisher();
    const profileExistence = makeProfileExistenceService();
    const useCase = new EditPropertyAgentUseCase(repo, eventPublisher, profileExistence);

    await expect(
      useCase.execute(
        new EditPropertyAgentCommand('00000000-0000-4000-8000-000000000000', {
          agentProfileId: 'agent-uuid-1',
        }),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(profileExistence.agentExists).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should throw a validation AppException when the agent profile does not exist', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty(null);
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const profileExistence = makeProfileExistenceService();
    profileExistence.agentExists.mockResolvedValue(false);
    const useCase = new EditPropertyAgentUseCase(repo, eventPublisher, profileExistence);

    await expect(
      useCase.execute(
        new EditPropertyAgentCommand('550e8400-e29b-41d4-a716-446655440000', {
          agentProfileId: 'agent-uuid-missing',
        }),
      ),
    ).rejects.toBeInstanceOf(AppException);

    expect(profileExistence.agentExists).toHaveBeenCalledWith('agent-uuid-missing');
    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should throw a DomainException when the new agent id equals the current one', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty('agent-uuid-current');
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const profileExistence = makeProfileExistenceService();
    profileExistence.agentExists.mockResolvedValue(true);
    const useCase = new EditPropertyAgentUseCase(repo, eventPublisher, profileExistence);

    await expect(
      useCase.execute(
        new EditPropertyAgentCommand('550e8400-e29b-41d4-a716-446655440000', {
          agentProfileId: 'agent-uuid-current',
        }),
      ),
    ).rejects.toThrow(DomainException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should throw a DomainException when both current and new are null', async () => {
    const repo = makeRepository();
    const property = makeExistingProperty(null);
    repo.findById.mockResolvedValue(property);
    const eventPublisher = makeEventPublisher();
    const profileExistence = makeProfileExistenceService();
    const useCase = new EditPropertyAgentUseCase(repo, eventPublisher, profileExistence);

    await expect(
      useCase.execute(
        new EditPropertyAgentCommand('550e8400-e29b-41d4-a716-446655440000', {
          agentProfileId: null,
        }),
      ),
    ).rejects.toThrow(DomainException);

    expect(repo.save).not.toHaveBeenCalled();
    expect(eventPublisher.publish).not.toHaveBeenCalled();
  });
});
