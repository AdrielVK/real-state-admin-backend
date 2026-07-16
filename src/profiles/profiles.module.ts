import { Module } from '@nestjs/common';

import { DomainEventModule } from '@shared/infrastructure';

import { IdentityModule } from '../identity/identity.module';
import { CreateBusinessUserUseCase } from './application/commands/create-business-user.use-case';
import { CreateProfileOnUserRegisteredUseCase } from './application/handlers/create-profile-on-user-registered.use-case';
import { IProfileRepositoryToken } from './domain';
import { PrismaProfileRepository } from './infrastructure/repositories/prisma-profile.repository';
import { ProfilesController } from './presentation/controllers/profiles.controller';

@Module({
  imports: [DomainEventModule, IdentityModule],
  providers: [
    {
      provide: IProfileRepositoryToken,
      useClass: PrismaProfileRepository,
    },
    CreateProfileOnUserRegisteredUseCase,
    CreateBusinessUserUseCase,
  ],
  controllers: [ProfilesController],
  exports: [IProfileRepositoryToken],
})
export class ProfilesModule {}

export type { IProfileRepository } from './domain';
