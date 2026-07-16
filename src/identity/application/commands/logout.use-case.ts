import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import type { ICommand, ICommandHandler } from '@shared/domain';
import { ErrorCode } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { type IRefreshTokenRepository, IRefreshTokenRepositoryToken } from '../../domain';

export class LogoutCommand implements ICommand {
  readonly _resultType?: unknown;

  constructor(readonly refreshToken: string) {}
}

@Injectable()
export class LogoutUseCase implements ICommandHandler<LogoutCommand, void> {
  constructor(
    @Inject(IRefreshTokenRepositoryToken)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const tokenHash = createHash('sha256').update(command.refreshToken).digest('hex');
    const token = await this.refreshTokenRepository.findByToken(tokenHash);

    if (!token) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Token de refresco no encontrado o inválido');
    }
    if (token.isRevoked()) {
      throw new AppException(ErrorCode.UNAUTHORIZED, 'Token de refresco revocado o expirado');
    }

    token.revoke();
    await this.refreshTokenRepository.revoke(token);
  }
}
