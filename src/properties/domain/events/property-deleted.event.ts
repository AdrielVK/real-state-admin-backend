import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

export class PropertyDeletedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'property.deleted';

  constructor(readonly propertyId: string) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
