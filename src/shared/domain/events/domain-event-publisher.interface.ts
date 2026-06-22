import type { IDomainEvent } from './domain-event.interface';

export interface IDomainEventPublisher {
  publish(event: IDomainEvent): Promise<void>;
}
