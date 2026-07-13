import type { Prisma } from '../../../generated/prisma/client';
import type { RefreshTokenModel } from '../../../generated/prisma/models/RefreshToken';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenId } from '../../domain/value-objects/refresh-token-id.value-object';

export const PrismaRefreshTokenMapper = {
  toDomain(prismaToken: RefreshTokenModel): RefreshToken {
    return RefreshToken.reconstitute(
      new RefreshTokenId(prismaToken.id),
      prismaToken.userId,
      prismaToken.tokenHash,
      prismaToken.expiresAt,
      prismaToken.revokedAt,
      prismaToken.createdAt,
    );
  },

  toPrismaCreate(domain: RefreshToken): Prisma.RefreshTokenUncheckedCreateInput {
    return {
      id: domain.id.toValue(),
      userId: domain.userId,
      tokenHash: domain.tokenHash,
      expiresAt: domain.expiresAt,
      revokedAt: domain.revokedAt,
      createdAt: domain.createdAt,
    };
  },

  toPrismaUpdate(domain: RefreshToken): Prisma.RefreshTokenUncheckedUpdateInput {
    return {
      revokedAt: domain.revokedAt,
    };
  },
};
