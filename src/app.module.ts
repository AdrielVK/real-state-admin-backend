import { Module } from '@nestjs/common';

import { DomainEventModule, PrismaModule, SharedConfigModule } from '@shared/infrastructure';
import { UsersAuthModule } from '@users-auth/index';

@Module({
  imports: [SharedConfigModule, PrismaModule, DomainEventModule, UsersAuthModule],
})
export class AppModule {}
