import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

import type { PropertyStatus } from '../enums/property-status.enum';

export class PropertyCreatedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'properties.property.created';

  constructor(
    readonly propertyId: string,
    readonly placeId: string,
    readonly status: PropertyStatus,
    readonly internalId: string | null,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
