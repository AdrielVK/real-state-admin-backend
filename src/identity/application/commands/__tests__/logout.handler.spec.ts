import { createHash } from 'node:crypto';

import { ErrorCode } from '@shared/domain';
import { AppException } from '@shared/presentation';
import { type IRefreshTokenRepository, RefreshToken, RefreshTokenId } from '@identity/domain';

import { LogoutCommand, LogoutHandler } from '../logout.handler';

const REFRESH_TOKEN_ID = '11111111-2222-3333-4444-555555555555';
const RAW_TOKEN = 'raw-refresh-token';

function makeCommand(overrides: Partial<{ refreshToken: string }> = {}): LogoutCommand {
  return new LogoutCommand(overrides.refreshToken ?? RAW_TOKEN);
}

function makeActiveToken(overrides: Partial<{ revoked: boolean }> = {}): RefreshToken {
  const future = new Date(Date.now() + 60_000);
  return RefreshToken.reconstitute(
    new RefreshTokenId(REFRESH_TOKEN_ID),
    'user-id',
    'some-hash',
    future,
    overrides.revoked ? new Date() : null,
    new Date(),
  );
}

function makeMockRefreshTokenRepository(): jest.Mocked<IRefreshTokenRepository> {
  return {
    save: jest.fn(),
    findByToken: jest.fn(),
    revoke: jest.fn().mockResolvedValue(),
    revokeAllForUser: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IRefreshTokenRepository>;
}

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  beforeEach(() => {
    mockRefreshTokenRepository = makeMockRefreshTokenRepository();
    handler = new LogoutHandler(mockRefreshTokenRepository);
  });

  describe('execute() — success path', () => {
    it('should look up the refresh token by SHA-256 hash', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken());

      await handler.execute(makeCommand({ refreshToken: 'my-raw-token' }));

      const expectedHash = createHash('sha256').update('my-raw-token').digest('hex');
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(expectedHash);
    });

    it('should revoke the token and persist the revocation', async () => {
      const token = makeActiveToken();
      mockRefreshTokenRepository.findByToken.mockResolvedValue(token);

      expect(token.isRevoked()).toBe(false);

      await handler.execute(makeCommand());

      expect(token.isRevoked()).toBe(true);
      expect(mockRefreshTokenRepository.revoke).toHaveBeenCalledWith(token);
    });

    it('should resolve with void on success', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken());

      await expect(handler.execute(makeCommand())).resolves.toBeUndefined();
    });
  });

  describe('execute() — failure paths', () => {
    it('should throw UNAUTHORIZED when the refresh token is not found', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

      try {
        await handler.execute(makeCommand());
        throw new Error('handler should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
        expect((error as AppException).message).toBe('Token de refresco no encontrado o inválido');
      }
    });

    it('should throw UNAUTHORIZED when the refresh token is already revoked', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken({ revoked: true }));

      try {
        await handler.execute(makeCommand());
        throw new Error('handler should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should not call revoke() when token is unknown', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

      try {
        await handler.execute(makeCommand());
      } catch {
        // expected
      }

      expect(mockRefreshTokenRepository.revoke).not.toHaveBeenCalled();
    });

    it('should not call revoke() when token is already revoked', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken({ revoked: true }));

      try {
        await handler.execute(makeCommand());
      } catch {
        // expected
      }

      expect(mockRefreshTokenRepository.revoke).not.toHaveBeenCalled();
    });
  });
});
