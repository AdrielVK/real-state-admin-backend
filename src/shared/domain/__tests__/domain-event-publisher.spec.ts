import type { IDomainEvent } from '../events/domain-event.interface';
import type { IDomainEventPublisher } from '../events/domain-event-publisher.interface';

describe('IDomainEventPublisher', () => {
  it('should define a publish method signature', () => {
    const publishFn = jest.fn<(event: IDomainEvent) => Promise<void>>().mockResolvedValue();
    const mockPublisher: IDomainEventPublisher = {
      publish: publishFn,
    };
    const event: IDomainEvent = {
      eventId: 'evt-1',
      occurredOn: new Date(),
      aggregateId: 'agg-1',
      eventName: 'test.event',
    };
    void mockPublisher.publish(event);
    expect(publishFn).toHaveBeenCalledWith(event);
  });
});
