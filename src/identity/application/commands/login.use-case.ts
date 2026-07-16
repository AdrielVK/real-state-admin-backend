import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { REFRESH_TOKEN_TTL_MS } from '@shared/commons';
import type { ICommand, ICommandHandler } from '@shared/domain';
import { ErrorCode } from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IPasswordHasher,
  IPasswordHasherToken,
  type IRefreshTokenRepository,
  IRefreshTokenRepositoryToken,
  type ITokenService,
  ITokenServiceToken,
  type IUserRepository,
  IUserRepositoryToken,
  RefreshToken,
  UserEmail,
} from '../../domain';
import { PlainPassword } from '../../domain/value-objects/plain-password.value-object';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export class LoginCommand implements ICommand<LoginResult> {
  readonly _resultType?: LoginResult;

  constructor(
    readonly email: string,
    readonly password: string,
  ) {}
}

@Injectable()
export class LoginUseCase implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository,
    @Inject(IPasswordHasherToken) private readonly passwordHasher: IPasswordHasher,
    @Inject(ITokenServiceToken) private readonly tokenService: ITokenService,
    @Inject(IRefreshTokenRepositoryToken)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(new UserEmail(command.email));
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Credenciales inválidas');
    }

    const passwordMatches = await this.passwordHasher.compare(
      PlainPassword.create(command.password),
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Credenciales inválidas');
    }

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id.toValue(),
      email: user.email.value,
      role: user.role,
    });

    const rawRefreshToken = this.tokenService.generateRefreshToken();
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

    const refreshTokenAggregate = RefreshToken.create(
      user.id.toValue(),
      tokenHash,
      REFRESH_TOKEN_TTL_MS,
    );
    await this.refreshTokenRepository.save(refreshTokenAggregate);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id.toValue(),
        email: user.email.value,
        role: user.role,
      },
    };
  }
}
