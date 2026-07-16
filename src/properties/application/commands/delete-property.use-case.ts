import { Inject, Injectable } from '@nestjs/common';

import {
  ErrorCode,
  type ICommand,
  type ICommandHandler,
  type IDomainEventPublisher,
} from '@shared/domain';
import { AppException } from '@shared/presentation';

import { type IPropertyRepository, IPropertyRepositoryToken, PropertyId } from '../../domain';

export class DeletePropertyCommand implements ICommand {
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  readonly _resultType?: void;

  constructor(readonly propertyId: string) {}
}

@Injectable()
export class DeletePropertyUseCase implements ICommandHandler<DeletePropertyCommand, void> {
  constructor(
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(command: DeletePropertyCommand): Promise<void> {
    const id = new PropertyId(command.propertyId);
    const property = await this.propertyRepository.findById(id);

    if (!property) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        `Property with id "${command.propertyId}" not found`,
      );
    }

    property.softDelete();
    await this.propertyRepository.save(property);

    const events = property.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));
  }
}
