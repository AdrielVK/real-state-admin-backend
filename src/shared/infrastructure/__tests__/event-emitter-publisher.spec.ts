import { EventEmitter2 } from '@nestjs/event-emitter';

import type { IDomainEvent } from '@shared/domain';

import { NestEventEmitterPublisher } from '../events/event-emitter-publisher';

describe('NestEventEmitterPublisher', () => {
  let publisher: NestEventEmitterPublisher;
  let eventEmitter: EventEmitter2;

  beforeEach(() => {
    eventEmitter = new EventEmitter2();
    publisher = new NestEventEmitterPublisher(eventEmitter);
  });

  it('should emit event via EventEmitter2', async () => {
    const event: IDomainEvent = {
      eventId: 'evt-1',
      occurredOn: new Date('2024-01-01'),
      aggregateId: 'agg-1',
      eventName: 'user.created',
    };

    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    await publisher.publish(event);

    expect(emitSpy).toHaveBeenCalledWith('user.created', event);
  });

  it('should emit with correct event name', async () => {
    const event: IDomainEvent = {
      eventId: 'evt-2',
      occurredOn: new Date('2024-01-01'),
      aggregateId: 'agg-2',
      eventName: 'order.placed',
    };

    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    await publisher.publish(event);

    expect(emitSpy).toHaveBeenCalledWith('order.placed', event);
  });
});
