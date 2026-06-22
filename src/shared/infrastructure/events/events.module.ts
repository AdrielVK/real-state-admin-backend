import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { NestEventEmitterPublisher } from './event-emitter-publisher';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: 'IDomainEventPublisher',
      useClass: NestEventEmitterPublisher,
    },
  ],
  exports: ['IDomainEventPublisher', EventEmitterModule],
})
export class DomainEventModule {}
