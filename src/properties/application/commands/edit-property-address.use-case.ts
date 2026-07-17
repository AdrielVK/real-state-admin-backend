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
  PropertyAddress,
  PropertyId,
} from '../../domain';
import type { EditPropertyAddressDto } from '../dto/edit-property-address.dto';

export class EditPropertyAddressCommand implements ICommand<Property> {
  readonly _resultType?: Property;

  constructor(
    readonly propertyId: string,
    readonly dto: EditPropertyAddressDto,
  ) {}
}

@Injectable()
export class EditPropertyAddressUseCase implements ICommandHandler<
  EditPropertyAddressCommand,
  Property
> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(command: EditPropertyAddressCommand): Promise<Property> {
    const property = await this.propertyRepository.findById(new PropertyId(command.propertyId));

    if (!property) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        `Property with id "${command.propertyId}" not found`,
      );
    }

    const newAddress = PropertyAddress.fromCreateDto(command.dto);
    property.updateAddress(newAddress);

    await this.propertyRepository.save(property);

    const events = property.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return property;
  }
}
