import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

import type { PropertyStatus } from '../enums/property-status.enum';

export class PropertyStatusChangedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'property.status-changed';

  constructor(
    readonly propertyId: string,
    readonly oldStatus: PropertyStatus,
    readonly newStatus: PropertyStatus,
    readonly changedAt: Date,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
