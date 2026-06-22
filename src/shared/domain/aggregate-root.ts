import { Entity } from './entity';
import type { IDomainEvent } from './events/domain-event.interface';
import type { Identifier } from './value-objects/identifier';

export abstract class AggregateRoot<T extends Identifier<unknown>> extends Entity<T> {
  private readonly _domainEvents: IDomainEvent[] = [];

  protected constructor(id: T) {
    super(id);
  }

  get domainEvents(): readonly IDomainEvent[] {
    return [...this._domainEvents];
  }

  addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  clearEvents(): void {
    this._domainEvents.length = 0;
  }
}
