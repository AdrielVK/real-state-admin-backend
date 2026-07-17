import { Inject, Injectable } from '@nestjs/common';

import {
  ErrorCode,
  type ICommand,
  type ICommandHandler,
  type IDomainEventPublisher,
} from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type CharacteristicCategory,
  type IProfileExistenceService,
  IProfileExistenceServiceToken,
  type IPropertyRepository,
  IPropertyRepositoryToken,
  Property,
  PropertyAddress,
  PropertyCharacteristicValue,
  PropertyFeatures,
} from '../../domain';
import type { CreatePropertyDto } from '../dto/create-property.dto';

export class CreatePropertyCommand implements ICommand<Property> {
  readonly _resultType?: Property;

  constructor(
    readonly dto: CreatePropertyDto,
    readonly creatorId: string,
  ) {}
}

@Injectable()
export class CreatePropertyUseCase implements ICommandHandler<CreatePropertyCommand, Property> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
    @Inject(IProfileExistenceServiceToken)
    private readonly profileExistence: IProfileExistenceService,
  ) {}

  async execute(command: CreatePropertyCommand): Promise<Property> {
    const { dto, creatorId } = command;

    this.ensureCreatorIdIsPresent(creatorId);
    this.ensureCharacteristicsAreUnique(dto.characteristics);
    await this.ensureInternalCodeUnique(dto.internalCode);
    await this.ensureProfilesExist(dto.agentProfileId, dto.ownerProfileId);

    const property = Property.create({
      internalCode: dto.internalCode ?? null,
      address: PropertyAddress.fromCreateDto(dto.address),
      propertyType: dto.propertyType,
      status: dto.status,
      features: dto.features ? PropertyFeatures.fromCreateDto(dto.features) : null,
      ownerProfileId: dto.ownerProfileId ?? null,
      agentProfileId: dto.agentProfileId ?? null,
      characteristics: (dto.characteristics ?? []).map((c) =>
        PropertyCharacteristicValue.fromCreate(c.name, c.slug, c.category),
      ),
      createdByUserId: creatorId,
    });

    await this.propertyRepository.save(property);

    const events = property.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return property;
  }

  private ensureCreatorIdIsPresent(creatorId: string): void {
    if (!creatorId || creatorId.trim() === '') {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'El identificador del usuario creador es obligatorio',
      );
    }
  }

  private ensureCharacteristicsAreUnique(
    characteristics?: Array<{ slug: string; category: CharacteristicCategory }>,
  ): void {
    if (!characteristics || characteristics.length === 0) return;

    const keys = characteristics.map((c) => `${c.slug}:${c.category}`);
    if (new Set(keys).size !== keys.length) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'No se permiten características duplicadas (mismo slug y categoría)',
      );
    }
  }

  private async ensureInternalCodeUnique(internalCode?: string | null): Promise<void> {
    if (!internalCode) return;

    const existing = await this.propertyRepository.findByInternalCode(internalCode);
    if (existing) {
      throw new AppException(
        ErrorCode.CONFLICT,
        `Ya existe una propiedad con el código interno "${internalCode}"`,
      );
    }
  }

  private async ensureProfilesExist(
    agentProfileId?: string | null,
    ownerProfileId?: string | null,
  ): Promise<void> {
    if (agentProfileId) {
      const exists = await this.profileExistence.agentExists(agentProfileId);

      if (!exists) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          `El perfil de agente "${agentProfileId}" no existe`,
        );
      }
    }
    if (ownerProfileId) {
      const exists = await this.profileExistence.ownerExists(ownerProfileId);
      if (!exists) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          `El perfil de propietario "${ownerProfileId}" no existe`,
        );
      }
    }
  }
}
