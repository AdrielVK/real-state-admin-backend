import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { REFRESH_TOKEN_TTL_MS } from '@shared/commons';
import type { ICommand, ICommandHandler } from '@shared/domain';
import { ErrorCode } from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IRefreshTokenRepository,
  IRefreshTokenRepositoryToken,
  type ITokenService,
  ITokenServiceToken,
  type IUserRepository,
  IUserRepositoryToken,
  RefreshToken,
  UserId,
} from '../../domain';
import type { LoginResult } from './login.use-case';

export class RefreshCommand implements ICommand<LoginResult> {
  readonly _resultType?: LoginResult;

  constructor(readonly refreshToken: string) {}
}

@Injectable()
export class RefreshUseCase implements ICommandHandler<RefreshCommand, LoginResult> {
  constructor(
    @Inject(IRefreshTokenRepositoryToken)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(ITokenServiceToken) private readonly tokenService: ITokenService,
    @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RefreshCommand): Promise<LoginResult> {
    const tokenHash = createHash('sha256').update(command.refreshToken).digest('hex');
    const existingToken = await this.refreshTokenRepository.findByToken(tokenHash);

    if (!existingToken) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Token de refresco no encontrado o inválido');
    }
    if (!existingToken.isValid()) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Token de refresco revocado o expirado');
    }

    existingToken.revoke();
    await this.refreshTokenRepository.revoke(existingToken);

    const user = await this.userRepository.findById(new UserId(existingToken.userId));
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Token de refresco no encontrado o inválido');
    }

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id.toValue(),
      email: user.email.value,
      role: user.role,
    });

    const rawRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

    const newRefreshToken = RefreshToken.create(
      user.id.toValue(),
      newTokenHash,
      REFRESH_TOKEN_TTL_MS,
    );
    await this.refreshTokenRepository.save(newRefreshToken);

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
