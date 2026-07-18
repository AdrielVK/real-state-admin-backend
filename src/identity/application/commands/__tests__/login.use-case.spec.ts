import { createHash } from 'node:crypto';

import { ErrorCode } from '@shared/domain';
import { UserRole } from '@shared/domain/value-objects/user-role.enum';
import { AppException } from '@shared/presentation';
import {
  type IPasswordHasher,
  type IRefreshTokenRepository,
  type ITokenService,
  type IUserRepository,
  PlainPassword,
  RefreshToken,
  User,
  UserStatus,
} from '@identity/domain';

import { LoginCommand, type LoginResult, LoginUseCase } from '../login.use-case';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeCommand(overrides: Partial<{ email: string; password: string }> = {}): LoginCommand {
  return new LoginCommand(overrides.email ?? 'test@example.com', overrides.password ?? 'Secure1!');
}

function makeUser(
  overrides: Partial<{ id: string; email: string; role: UserRole; passwordHash: string }> = {},
): User {
  return User.reconstitute(
    {
      toValue: () => overrides.id ?? VALID_UUID,
    } as never,
    { value: overrides.email ?? 'test@example.com' } as never,
    overrides.passwordHash ?? 'hashed-secure-1',
    'John',
    'Doe',
    overrides.role ?? UserRole.ADMIN,
    UserStatus.ACTIVE,
    new Date('2024-01-01'),
    new Date('2024-01-01'),
  );
}

function makeMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn().mockImplementation(async (user: User) => user),
    delete: jest.fn(),
  } as jest.Mocked<IUserRepository>;
}

function makeMockPasswordHasher(): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  } as jest.Mocked<IPasswordHasher>;
}

function makeMockTokenService(): jest.Mocked<ITokenService> {
  return {
    generateAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  } as jest.Mocked<ITokenService>;
}

function makeMockRefreshTokenRepository(): jest.Mocked<IRefreshTokenRepository> {
  return {
    save: jest.fn().mockImplementation(async (token: RefreshToken) => token),
    findByToken: jest.fn(),
    revoke: jest.fn().mockResolvedValue(),
    revokeAllForUser: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IRefreshTokenRepository>;
}

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockTokenService: jest.Mocked<ITokenService>;
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  beforeEach(() => {
    mockUserRepository = makeMockUserRepository();
    mockPasswordHasher = makeMockPasswordHasher();
    mockTokenService = makeMockTokenService();
    mockRefreshTokenRepository = makeMockRefreshTokenRepository();
    useCase = new LoginUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService,
      mockRefreshTokenRepository,
    );
  });

  describe('execute() — success path', () => {
    it('should return a LoginResult with accessToken, refreshToken, and user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockResolvedValue('signed.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('raw-refresh-uuid');

      const result: LoginResult = await useCase.execute(makeCommand());

      expect(result.accessToken).toBe('signed.jwt');
      expect(result.refreshToken).toBe('raw-refresh-uuid');
      expect(result.user).toEqual({
        id: VALID_UUID,
        email: 'test@example.com',
        role: UserRole.ADMIN,
      });
    });

    it('should look up the user by email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockResolvedValue('signed.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('raw-refresh-uuid');

      await useCase.execute(makeCommand({ email: 'jane@example.com' }));

      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      const emailArg = mockUserRepository.findByEmail.mock.calls[0]?.[0] as { value: string };
      expect(emailArg.value).toBe('jane@example.com');
    });

    it('should compare the password with the stored hash', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser({ passwordHash: 'stored-hash' }));
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockResolvedValue('signed.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('raw-refresh-uuid');

      await useCase.execute(makeCommand({ password: 'Secure1!' }));

      expect(mockPasswordHasher.compare).toHaveBeenCalledTimes(1);
      const [plainArg, hashArg] = mockPasswordHasher.compare.mock.calls[0] ?? [];
      expect(plainArg).toBeInstanceOf(PlainPassword);
      expect((plainArg as PlainPassword).value).toBe('Secure1!');
      expect(hashArg).toBe('stored-hash');
    });

    it('should generate an access token with sub, email, and role from the user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        makeUser({ id: VALID_UUID, email: 'jane@example.com', role: UserRole.AGENT }),
      );
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockResolvedValue('signed.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('raw-refresh-uuid');

      await useCase.execute(makeCommand());

      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: VALID_UUID,
        email: 'jane@example.com',
        role: UserRole.AGENT,
      });
    });

    it('should generate a refresh token and persist its hash with a 14-day TTL', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser({ id: VALID_UUID }));
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockResolvedValue('signed.jwt');
      mockTokenService.generateRefreshToken.mockReturnValue('raw-refresh-uuid');

      const before = Date.now();
      await useCase.execute(makeCommand());
      const after = Date.now();

      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledTimes(1);
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledTimes(1);
      const saved = mockRefreshTokenRepository.save.mock.calls[0]?.[0] as RefreshToken;
      expect(saved).toBeInstanceOf(RefreshToken);
      expect(saved.userId).toBe(VALID_UUID);

      const expectedHash = createHash('sha256').update('raw-refresh-uuid').digest('hex');
      expect(saved.tokenHash).toBe(expectedHash);

      const expectedTtl = 14 * 24 * 60 * 60 * 1000;
      expect(saved.expiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedTtl);
      expect(saved.expiresAt.getTime()).toBeLessThanOrEqual(after + expectedTtl);
    });
  });

  describe('execute() — failure paths', () => {
    it('should throw UNAUTHORIZED when user is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(makeCommand())).rejects.toBeInstanceOf(AppException);

      try {
        await useCase.execute(makeCommand());
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
        expect((error as AppException).message).toBe('Credenciales inválidas');
      }
    });

    it('should throw UNAUTHORIZED when password does not match', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());
      mockPasswordHasher.compare.mockResolvedValue(false);

      await expect(useCase.execute(makeCommand())).rejects.toBeInstanceOf(AppException);

      try {
        await useCase.execute(makeCommand());
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect((error as AppException).code).toBe(ErrorCode.UNAUTHORIZED);
        expect((error as AppException).message).toBe('Credenciales inválidas');
      }
    });

    it('should not call token service or refresh token repo when user is missing', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      try {
        await useCase.execute(makeCommand());
      } catch {
        // expected
      }

      expect(mockPasswordHasher.compare).not.toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('should not issue tokens when password is invalid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());
      mockPasswordHasher.compare.mockResolvedValue(false);

      try {
        await useCase.execute(makeCommand());
      } catch {
        // expected
      }

      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate validation errors from invalid email format', async () => {
      await expect(useCase.execute(makeCommand({ email: 'not-an-email' }))).rejects.toThrow();
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });
  });
});
