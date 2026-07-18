import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

export class PropertyAgentChangedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'property.agent-changed';

  constructor(
    readonly propertyId: string,
    readonly oldAgentId: string | null,
    readonly newAgentId: string | null,
    readonly changedAt: Date,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = propertyId;
  }
}
