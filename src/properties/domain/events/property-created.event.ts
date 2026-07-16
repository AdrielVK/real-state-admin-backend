import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

export class PropertyCreatedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'property.created';

  constructor(
    readonly propertyId: string,
    readonly internalCode: string | null,
    readonly propertyType: string,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
