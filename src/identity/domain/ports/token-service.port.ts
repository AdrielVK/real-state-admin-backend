export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  generateRefreshToken(): string;
}

export const ITokenServiceToken = Symbol('ITokenService');
