import { Module } from '@nestjs/common';

import { DomainEventModule, PrismaModule, SharedConfigModule } from '@shared/infrastructure';
import { HealthController } from '@shared/presentation';
import { IdentityModule } from '@identity/index';
import { PropertiesModule } from '@properties/index';
import { ProfilesModule } from '@profiles/index';

@Module({
  imports: [
    SharedConfigModule,
    PrismaModule,
    DomainEventModule,
    IdentityModule,
    ProfilesModule,
    PropertiesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
