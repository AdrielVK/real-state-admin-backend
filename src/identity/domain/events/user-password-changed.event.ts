import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';

export class UserPasswordChangedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventName = 'user.passwordChanged';

  constructor(readonly aggregateId: string) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
  }
}
