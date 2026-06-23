import { randomUUID } from 'node:crypto';

import type { IDomainEvent } from '@shared/domain';
import type { UserRole } from '@shared/domain/value-objects/user-role.enum';

export class UserRegisteredEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'identity.user.registered';

  constructor(
    readonly userId: string,
    readonly email: string,
    readonly role: UserRole,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = userId;
  }
}
