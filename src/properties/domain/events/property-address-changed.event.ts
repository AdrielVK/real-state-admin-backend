import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

import type { PropertyAddressProps } from '../value-objects/property-address.value-object';

export class PropertyAddressChangedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'property.address-changed';

  constructor(
    readonly propertyId: string,
    readonly oldAddress: PropertyAddressProps,
    readonly newAddress: PropertyAddressProps,
    readonly changedAt: Date,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
