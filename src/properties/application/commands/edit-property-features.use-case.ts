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
} from '../../domain';
import type { EditPropertyFeaturesDto } from '../dto/edit-property-features.dto';

export class EditPropertyFeaturesCommand implements ICommand<Property> {
  readonly _resultType?: Property;

  constructor(
    readonly propertyId: string,
    readonly dto: EditPropertyFeaturesDto,
  ) {}
}

@Injectable()
export class EditPropertyFeaturesUseCase implements ICommandHandler<
  EditPropertyFeaturesCommand,
  Property
> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(command: EditPropertyFeaturesCommand): Promise<Property> {
    const property = await this.propertyRepository.findById(new PropertyId(command.propertyId));

    if (!property) {
      throw new AppException(ErrorCode.NOT_FOUND, `Propiedad no encontrada`);
    }

    property.updateFeatures(command.dto);

    await this.propertyRepository.save(property);

    const events = property.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return property;
  }
}
