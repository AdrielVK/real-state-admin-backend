import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import type { IDomainEvent, IDomainEventPublisher } from '@shared/domain';

@Injectable()
export class NestEventEmitterPublisher implements IDomainEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async publish(event: IDomainEvent): Promise<void> {
    this.eventEmitter.emit(event.eventName, event);
  }
}
