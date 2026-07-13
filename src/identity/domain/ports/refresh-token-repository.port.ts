import type { RefreshToken } from '../entities/refresh-token.entity';

export interface IRefreshTokenRepository {
  save(token: RefreshToken): Promise<RefreshToken>;
  findByToken(tokenHash: string): Promise<RefreshToken | null>;
  revoke(token: RefreshToken): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export const IRefreshTokenRepositoryToken = Symbol('IRefreshTokenRepository');
