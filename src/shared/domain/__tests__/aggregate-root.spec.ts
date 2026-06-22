import { AggregateRoot } from '../aggregate-root';
import type { IDomainEvent } from '../events/domain-event.interface';
import { Identifier } from '../value-objects/identifier';

class TestId extends Identifier<string> {}

class TestEvent implements IDomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly eventName = 'test.event';

  constructor(aggregateId: string) {
    this.eventId = 'evt-1';
    this.occurredOn = new Date('2024-01-01');
    this.aggregateId = aggregateId;
  }
}

class TestAggregate extends AggregateRoot<TestId> {
  private readonly _name: string;

  constructor(id: TestId, name: string) {
    super(id);
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  toPrimitives(): Record<string, unknown> {
    return { name: this._name };
  }
}

describe('AggregateRoot', () => {
  it('should start with no domain events', () => {
    const agg = new TestAggregate(new TestId('agg-1'), 'Test');
    expect(agg.domainEvents).toEqual([]);
  });

  it('should add a domain event', () => {
    const agg = new TestAggregate(new TestId('agg-1'), 'Test');
    const event = new TestEvent('agg-1');
    agg.addDomainEvent(event);
    expect(agg.domainEvents).toHaveLength(1);
    expect(agg.domainEvents[0]).toBe(event);
  });

  it('should accumulate multiple domain events', () => {
    const agg = new TestAggregate(new TestId('agg-1'), 'Test');
    agg.addDomainEvent(new TestEvent('agg-1'));
    agg.addDomainEvent(new TestEvent('agg-1'));
    expect(agg.domainEvents).toHaveLength(2);
  });

  it('should clear all domain events', () => {
    const agg = new TestAggregate(new TestId('agg-1'), 'Test');
    agg.addDomainEvent(new TestEvent('agg-1'));
    agg.addDomainEvent(new TestEvent('agg-1'));
    agg.clearEvents();
    expect(agg.domainEvents).toEqual([]);
  });

  it('should inherit Entity equality by id', () => {
    const id = new TestId('same-id');
    const agg1 = new TestAggregate(id, 'A');
    const agg2 = new TestAggregate(id, 'B');
    expect(agg1.equals(agg2)).toBe(true);
  });
});
