import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

import type { CharacteristicCategory } from '../enums/characteristic-category.enum';

export interface ChangedCharacteristic {
  slug: string;
  category: CharacteristicCategory;
}

export class PropertyCharacteristicsUpdatedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'property.characteristics-updated';

  constructor(
    readonly propertyId: string,
    readonly added: ChangedCharacteristic[],
    readonly removed: ChangedCharacteristic[],
    readonly changedAt: Date,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
