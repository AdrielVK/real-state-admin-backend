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
  PropertyCharacteristicValue,
  PropertyId,
} from '../../domain';
import type { EditPropertyCharacteristicsDto } from '../dto/edit-property-characteristics.dto';

export class EditPropertyCharacteristicsCommand implements ICommand<Property> {
  readonly _resultType?: Property;

  constructor(
    readonly propertyId: string,
    readonly dto: EditPropertyCharacteristicsDto,
  ) {}
}

@Injectable()
export class EditPropertyCharacteristicsUseCase implements ICommandHandler<
  EditPropertyCharacteristicsCommand,
  Property
> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(command: EditPropertyCharacteristicsCommand): Promise<Property> {
    const property = await this.propertyRepository.findById(new PropertyId(command.propertyId));

    if (!property) {
      throw new AppException(ErrorCode.NOT_FOUND, `Propiedad no encontrada`);
    }

    const toAdd = (command.dto.add ?? []).map((c) =>
      PropertyCharacteristicValue.fromCreate(c.name, c.slug, c.category),
    );
    const toRemove = (command.dto.remove ?? []).map((r) => ({
      slug: r.slug,
      category: r.category,
    }));

    property.updateCharacteristics(toAdd, toRemove);

    // DomainException from the aggregate already short-circuits before we reach
    // this point, so save → pull → publish is the correct DDD order: persist
    // state first, then extract and dispatch the recorded events.
    await this.propertyRepository.save(property);

    const events = property.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return property;
  }
}
