import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';

import type { TokenPayload } from '../../domain/ports/token-service.port';
import { JwtTokenService } from '../auth/jwt-token.service';

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const PAYLOAD: TokenPayload = {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
    service = new JwtTokenService(jwtService, configService);
  });

  describe('generateAccessToken()', () => {
    it('should sign the payload using jwtService.signAsync', async () => {
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');
      configService.get.mockReturnValue('15m');

      const token = await service.generateAccessToken(PAYLOAD);

      expect(token).toBe('signed.jwt.token');
      expect(jwtService.signAsync).toHaveBeenCalledWith(PAYLOAD, { expiresIn: '15m' });
    });

    it('should read the access expiration from config', async () => {
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');
      configService.get.mockImplementation((key: string, fallback?: string) => {
        if (key === 'JWT_ACCESS_EXPIRATION') return '5m';
        return fallback;
      });

      await service.generateAccessToken(PAYLOAD);

      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_EXPIRATION', '15m');
      expect(jwtService.signAsync).toHaveBeenCalledWith(PAYLOAD, { expiresIn: '5m' });
    });
  });

  describe('verifyAccessToken()', () => {
    it('should return the payload when jwtService.verifyAsync resolves it', async () => {
      jwtService.verifyAsync.mockResolvedValue(PAYLOAD);

      const result = await service.verifyAccessToken('any.jwt.token');

      expect(result).toEqual(PAYLOAD);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('any.jwt.token');
    });

    it('should propagate errors from jwtService.verifyAsync', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.verifyAccessToken('expired.jwt.token')).rejects.toThrow('jwt expired');
    });
  });

  describe('generateRefreshToken()', () => {
    it('should return a UUID v4 string', () => {
      const token = service.generateRefreshToken();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(typeof token).toBe('string');
      expect(token).toMatch(uuidV4Regex);
    });

    it('should return a different token on each call', () => {
      const a = service.generateRefreshToken();
      const b = service.generateRefreshToken();

      expect(a).not.toBe(b);
    });
  });
});
