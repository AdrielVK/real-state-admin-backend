import { Inject, Injectable } from '@nestjs/common';

import {
  ErrorCode,
  type ICommand,
  type ICommandHandler,
  type IDomainEventPublisher,
} from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IPropertyRepository,
  IPropertyRepositoryToken,
  Property,
  PropertyId,
  PropertyStatus,
} from '../../domain';
import type { EditPropertyStatusDto } from '../dto/edit-property-status.dto';

export class EditPropertyStatusCommand implements ICommand<Property> {
  readonly _resultType?: Property;

  constructor(
    readonly propertyId: string,
    readonly dto: EditPropertyStatusDto,
  ) {}
}

@Injectable()
export class EditPropertyStatusUseCase implements ICommandHandler<
  EditPropertyStatusCommand,
  Property
> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(command: EditPropertyStatusCommand): Promise<Property> {
    const property = await this.propertyRepository.findById(new PropertyId(command.propertyId));

    if (!property) {
      throw new AppException(ErrorCode.NOT_FOUND, `Propiedad no encontrada`);
    }

    property.updateStatus(command.dto.status as PropertyStatus);

    const events = property.pullDomainEvents();

    await this.propertyRepository.save(property);
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return property;
  }
}
