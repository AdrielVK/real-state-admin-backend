import type { IDomainEvent } from '@shared/domain';

export class UserCreatedEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'user.created';

  constructor(
    readonly userId: string,
    readonly email: string,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = userId;
  }
}
