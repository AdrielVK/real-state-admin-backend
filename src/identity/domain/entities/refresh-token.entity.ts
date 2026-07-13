import { AggregateRoot, DomainException, ErrorCode } from '@shared/domain';

import { RefreshTokenId } from '../value-objects/refresh-token-id.value-object';

interface RefreshTokenProps {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export class RefreshToken extends AggregateRoot<RefreshTokenId> {
  private readonly _userId: string;
  private readonly _tokenHash: string;
  private readonly _expiresAt: Date;
  private _revokedAt: Date | null;
  private readonly _createdAt: Date;

  private constructor(id: RefreshTokenId, props: RefreshTokenProps) {
    super(id);
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt;
    this._createdAt = props.createdAt;
  }

  static create(userId: string, tokenHash: string, ttlMs: number): RefreshToken {
    if (!userId) {
      throw new DomainException('El userId es obligatorio', ErrorCode.VALIDATION_ERROR);
    }
    if (!tokenHash) {
      throw new DomainException('El tokenHash es obligatorio', ErrorCode.VALIDATION_ERROR);
    }
    if (typeof ttlMs !== 'number' || ttlMs <= 0) {
      throw new DomainException('ttlMs debe ser un número positivo', ErrorCode.VALIDATION_ERROR);
    }
    const id = RefreshTokenId.generate();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);
    return new RefreshToken(id, {
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: now,
    });
  }

  static reconstitute(
    id: RefreshTokenId,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    revokedAt: Date | null,
    createdAt: Date,
  ): RefreshToken {
    return new RefreshToken(id, {
      userId,
      tokenHash,
      expiresAt,
      revokedAt,
      createdAt,
    });
  }

  revoke(): void {
    if (this._revokedAt !== null) {
      throw new DomainException('El token de refresco ya fue revocado', ErrorCode.VALIDATION_ERROR);
    }
    this._revokedAt = new Date();
  }

  isExpired(): boolean {
    return this._expiresAt.getTime() <= Date.now();
  }

  isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  get userId(): string {
    return this._userId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  toPrimitives(): Record<string, unknown> {
    return {
      id: this.id.toValue(),
      userId: this._userId,
      tokenHash: this._tokenHash,
      expiresAt: this._expiresAt,
      revokedAt: this._revokedAt,
      createdAt: this._createdAt,
    };
  }
}
