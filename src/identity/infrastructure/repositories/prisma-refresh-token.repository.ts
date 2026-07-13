import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shared/infrastructure';

import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import type { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port';
import { PrismaRefreshTokenMapper } from '../mappers/prisma-refresh-token.mapper';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(token: RefreshToken): Promise<RefreshToken> {
    await this.prisma.refreshToken.create({
      data: PrismaRefreshTokenMapper.toPrismaCreate(token),
    });
    token.pullDomainEvents();
    return token;
  }

  async findByToken(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return record ? PrismaRefreshTokenMapper.toDomain(record) : null;
  }

  async revoke(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: token.id.toValue() },
      data: PrismaRefreshTokenMapper.toPrismaUpdate(token),
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
