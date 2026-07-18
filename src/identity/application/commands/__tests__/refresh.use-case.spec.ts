import { createHash } from 'node:crypto';

import { ErrorCode } from '@shared/domain';
import { UserRole } from '@shared/domain/value-objects/user-role.enum';
import { AppException } from '@shared/presentation';
import {
  type IRefreshTokenRepository,
  type ITokenService,
  type IUserRepository,
  RefreshToken,
  RefreshTokenId,
  User,
  UserStatus,
} from '@identity/domain';

import { RefreshCommand, RefreshUseCase } from '../refresh.use-case';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const REFRESH_TOKEN_ID = '11111111-2222-3333-4444-555555555555';
const RAW_TOKEN = 'raw-refresh-token';

function makeCommand(overrides: Partial<{ refreshToken: string }> = {}): RefreshCommand {
  return new RefreshCommand(overrides.refreshToken ?? RAW_TOKEN);
}

function makeActiveToken(
  overrides: Partial<{ userId: string; revoked: boolean; expired: boolean }> = {},
): RefreshToken {
  const future = new Date(Date.now() + 60_000);
  return RefreshToken.reconstitute(
    new RefreshTokenId(REFRESH_TOKEN_ID),
    overrides.userId ?? VALID_UUID,
    'some-hash',
    overrides.expired ? new Date(Date.now() - 60_000) : future,
    overrides.revoked ? new Date() : null,
    new Date(),
  );
}

function makeUser(): User {
  return User.reconstitute(
    { toValue: () => VALID_UUID } as never,
    { value: 'test@example.com' } as never,
    'hashed',
    'John',
    'Doe',
    UserRole.ADMIN,
    UserStatus.ACTIVE,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );
}

function makeMockRefreshTokenRepository(): jest.Mocked<IRefreshTokenRepository> {
  return {
    save: jest.fn().mockImplementation(async (token: RefreshToken) => token),
    findByToken: jest.fn(),
    revoke: jest.fn().mockResolvedValue(),
    revokeAllForUser: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IRefreshTokenRepository>;
}

function makeMockTokenService(): jest.Mocked<ITokenService> {
  return {
    generateAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  } as jest.Mocked<ITokenService>;
}

function makeMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<IUserRepository>;
}

describe('RefreshUseCase', () => {
  let useCase: RefreshUseCase;
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRefreshTokenRepository = makeMockRefreshTokenRepository();
    mockTokenService = makeMockTokenService();
    mockUserRepository = makeMockUserRepository();
    useCase = new RefreshUseCase(mockRefreshTokenRepository, mockTokenService, mockUserRepository);
  });

  describe('execute() — success path', () => {
    it('should rotate the refresh token and return a new pair', async () => {
      const existing = makeActiveToken();
      mockRefreshTokenRepository.findByToken.mockResolvedValue(existing);
      mockUserRepository.findById.mockResolvedValue(makeUser());
      mockTokenService.generateAccessToken.mockResolvedValue('new-access.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('new-raw-refresh');

      const result = await useCase.execute(makeCommand());

      expect(result.accessToken).toBe('new-access.jwt');
      expect(result.refreshToken).toBe('new-raw-refresh');
      expect(result.user).toEqual({
        id: VALID_UUID,
        email: 'test@example.com',
        role: UserRole.ADMIN,
      });
    });

    it('should look up the token by SHA-256 hash of the raw token', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken());
      mockUserRepository.findById.mockResolvedValue(makeUser());
      mockTokenService.generateAccessToken.mockResolvedValue('new-access.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('new-raw-refresh');

      await useCase.execute(makeCommand({ refreshToken: 'my-raw-token' }));

      const expectedHash = createHash('sha256').update('my-raw-token').digest('hex');
      expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(expectedHash);
    });

    it('should revoke the old refresh token', async () => {
      const existing = makeActiveToken();
      mockRefreshTokenRepository.findByToken.mockResolvedValue(existing);
      mockUserRepository.findById.mockResolvedValue(makeUser());
      mockTokenService.generateAccessToken.mockResolvedValue('new-access.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('new-raw-refresh');

      expect(existing.isRevoked()).toBe(false);

      await useCase.execute(makeCommand());

      expect(existing.isRevoked()).toBe(true);
      expect(mockRefreshTokenRepository.revoke).toHaveBeenCalledWith(existing);
    });

    it('should persist the new refresh token hash with 14-day TTL', async () => {
      const existing = makeActiveToken();
      mockRefreshTokenRepository.findByToken.mockResolvedValue(existing);
      mockUserRepository.findById.mockResolvedValue(makeUser());
      mockTokenService.generateAccessToken.mockResolvedValue('new-access.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('new-raw-refresh');

      const before = Date.now();
      await useCase.execute(makeCommand());
      const after = Date.now();

      expect(mockRefreshTokenRepository.save).toHaveBeenCalledTimes(1);
      const saved = mockRefreshTokenRepository.save.mock.calls[0]?.[0] as RefreshToken;
      expect(saved).toBeInstanceOf(RefreshToken);
      expect(saved.userId).toBe(VALID_UUID);

      const expectedHash = createHash('sha256').update('new-raw-refresh').digest('hex');
      expect(saved.tokenHash).toBe(expectedHash);

      const expectedTtl = 14 * 24 * 60 * 60 * 1000;
      expect(saved.expiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedTtl);
      expect(saved.expiresAt.getTime()).toBeLessThanOrEqual(after + expectedTtl);
    });

    it('should issue a new access token for the user behind the old refresh token', async () => {
      const existing = makeActiveToken({ userId: VALID_UUID });
      mockRefreshTokenRepository.findByToken.mockResolvedValue(existing);
      mockUserRepository.findById.mockResolvedValue(makeUser());
      mockTokenService.generateAccessToken.mockResolvedValue('new-access.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('new-raw-refresh');

      await useCase.execute(makeCommand());

      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: VALID_UUID,
        email: 'test@example.com',
        role: UserRole.ADMIN,
      });
    });
  });

  describe('execute() — failure paths', () => {
    it('should throw UNAUTHORIZED when the refresh token is not found', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

      let caught: unknown;
      try {
        await useCase.execute(makeCommand());
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
      expect((caught as AppException).message).toBe('Token de refresco no encontrado o inválido');
    });

    it('should throw UNAUTHORIZED when the refresh token is revoked', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken({ revoked: true }));

      try {
        await useCase.execute(makeCommand());
        throw new Error('useCase should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should throw UNAUTHORIZED when the refresh token is expired', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken({ expired: true }));

      try {
        await useCase.execute(makeCommand());
        throw new Error('useCase should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should throw UNAUTHORIZED when the user behind the refresh token no longer exists', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(makeActiveToken());
      mockUserRepository.findById.mockResolvedValue(null);

      try {
        await useCase.execute(makeCommand());
        throw new Error('useCase should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
      }
    });

    it('should not rotate when token is invalid', async () => {
      mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

      try {
        await useCase.execute(makeCommand());
      } catch {
        // expected
      }

      expect(mockRefreshTokenRepository.revoke).not.toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();
    });
  });
});
