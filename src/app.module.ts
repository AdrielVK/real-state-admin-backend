import { Module } from '@nestjs/common';

import { DomainEventModule, PrismaModule, SharedConfigModule } from '@shared/infrastructure';
import { IdentityModule } from '@identity/index';

@Module({
  imports: [SharedConfigModule, PrismaModule, DomainEventModule, IdentityModule],
})
export class AppModule {}
