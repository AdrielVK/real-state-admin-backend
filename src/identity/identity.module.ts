import { Module } from '@nestjs/common';

import { IPasswordHasherToken, IUserRepositoryToken } from './domain';
import { BcryptPasswordHasher } from './infrastructure/hashers/bcrypt-password-hasher';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: IUserRepositoryToken,
      useClass: PrismaUserRepository,
    },
    {
      provide: IPasswordHasherToken,
      useClass: BcryptPasswordHasher,
    },
    BcryptPasswordHasher,
  ],
  exports: [IUserRepositoryToken, IPasswordHasherToken],
})
export class IdentityModule {}
