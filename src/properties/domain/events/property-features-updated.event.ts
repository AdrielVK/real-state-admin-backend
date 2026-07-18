import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

import type { PropertyFeaturesProps } from '../value-objects/property-features.value-object';

export class PropertyFeaturesUpdatedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'property.features-updated';

  constructor(
    readonly propertyId: string,
    readonly oldFeatures: PropertyFeaturesProps | null,
    readonly newFeatures: PropertyFeaturesProps,
    readonly changedAt: Date,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
