import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { ITokenService, TokenPayload } from '../../domain/ports/token-service.port';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(payload: TokenPayload): Promise<string> {
    const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    return this.jwtService.signAsync(payload, {
      expiresIn: accessExpiration as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token);
  }

  generateRefreshToken(): string {
    return randomUUID();
  }
}
