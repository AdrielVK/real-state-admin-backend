import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { DomainEventModule } from '@shared/infrastructure';
import { JwtAuthGuard, RolesGuard } from '@shared/presentation';

import { CreateUserUseCase } from './application/commands/create-user.use-case';
import { LoginUseCase } from './application/commands/login.use-case';
import { LogoutUseCase } from './application/commands/logout.use-case';
import { RefreshUseCase } from './application/commands/refresh.use-case';
import {
  IPasswordHasherToken,
  IRefreshTokenRepositoryToken,
  ITokenServiceToken,
  IUserRepositoryToken,
} from './domain';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { BcryptPasswordHasher } from './infrastructure/hashers/bcrypt-password-hasher';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    DomainEventModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'JWT_ACCESS_EXPIRATION',
          ) as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: IUserRepositoryToken,
      useClass: PrismaUserRepository,
    },
    {
      provide: IPasswordHasherToken,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: ITokenServiceToken,
      useClass: JwtTokenService,
    },
    {
      provide: IRefreshTokenRepositoryToken,
      useClass: PrismaRefreshTokenRepository,
    },
    BcryptPasswordHasher,
    JwtTokenService,
    JwtStrategy,
    CreateUserUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [
    IUserRepositoryToken,
    IPasswordHasherToken,
    ITokenServiceToken,
    IRefreshTokenRepositoryToken,
  ],
})
export class IdentityModule {}
