import { Inject, Injectable } from '@nestjs/common';

import {
  ErrorCode,
  type ICommand,
  type ICommandHandler,
  type IDomainEventPublisher,
} from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IProfileExistenceService,
  IProfileExistenceServiceToken,
  type IPropertyRepository,
  IPropertyRepositoryToken,
  Property,
  PropertyId,
} from '../../domain';
import type { EditPropertyAgentDto } from '../dto/edit-property-agent.dto';

export class EditPropertyAgentCommand implements ICommand<Property> {
  readonly _resultType?: Property;

  constructor(
    readonly propertyId: string,
    readonly dto: EditPropertyAgentDto,
  ) {}
}

@Injectable()
export class EditPropertyAgentUseCase implements ICommandHandler<
  EditPropertyAgentCommand,
  Property
> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
    @Inject(IProfileExistenceServiceToken)
    private readonly profileExistence: IProfileExistenceService,
  ) {}

  async execute(command: EditPropertyAgentCommand): Promise<Property> {
    const property = await this.propertyRepository.findById(new PropertyId(command.propertyId));

    if (!property) {
      throw new AppException(ErrorCode.NOT_FOUND, `Propiedad no encontrada`);
    }

    const newAgentId = command.dto.agentProfileId ?? null;

    // Validate agent profile existence only when assigning a non-null id.
    if (newAgentId !== null) {
      const exists = await this.profileExistence.agentExists(newAgentId);
      if (!exists) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          `El perfil de agente "${newAgentId}" no existe`,
        );
      }
    }

    property.updateAgentProfileId(newAgentId);

    await this.propertyRepository.save(property);

    const events = property.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return property;
  }
}
