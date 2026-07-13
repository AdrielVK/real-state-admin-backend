import { DomainException, ErrorCode } from '@shared/domain';

import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenId } from '../value-objects/refresh-token-id.value-object';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TOKEN_HASH = 'a'.repeat(64);

describe('RefreshToken AggregateRoot', () => {
  describe('create()', () => {
    it('should set expiresAt to createdAt + ttl', () => {
      const ttlMs = 60_000;
      const before = Date.now();
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, ttlMs);
      const after = Date.now();

      expect(token.expiresAt.getTime()).toBeGreaterThanOrEqual(before + ttlMs);
      expect(token.expiresAt.getTime()).toBeLessThanOrEqual(after + ttlMs);
    });

    it('should set createdAt close to now', () => {
      const before = new Date();
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 1000);
      const after = new Date();

      expect(token.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(token.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set revokedAt to null on creation', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 1000);

      expect(token.revokedAt).toBeNull();
    });

    it('should set userId and tokenHash from arguments', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 1000);

      expect(token.userId).toBe(USER_ID);
      expect(token.tokenHash).toBe(TOKEN_HASH);
    });

    it('should generate a valid UUID v4 for id', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 1000);
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(token.id.toValue()).toMatch(uuidV4Regex);
    });

    it('should throw DomainException for empty userId', () => {
      expect(() => RefreshToken.create('', TOKEN_HASH, 1000)).toThrow(DomainException);
    });

    it('should throw DomainException for empty tokenHash', () => {
      expect(() => RefreshToken.create(USER_ID, '', 1000)).toThrow(DomainException);
    });

    it('should throw DomainException for non-positive ttl', () => {
      expect(() => RefreshToken.create(USER_ID, TOKEN_HASH, 0)).toThrow(DomainException);
      expect(() => RefreshToken.create(USER_ID, TOKEN_HASH, -1)).toThrow(DomainException);
    });
  });

  describe('revoke()', () => {
    it('should set revokedAt to a recent date', async () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);
      const before = new Date();
      await new Promise((r) => setTimeout(r, 5));
      token.revoke();
      const after = new Date();

      expect(token.revokedAt).not.toBeNull();
      expect(token.revokedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(token.revokedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw DomainException with VALIDATION_ERROR when called twice', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);
      token.revoke();

      let caught: unknown;
      try {
        token.revoke();
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(DomainException);
      expect((caught as DomainException).code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  describe('isExpired()', () => {
    it('should return false when expiresAt is in the future', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);

      expect(token.isExpired()).toBe(false);
    });

    it('should return true when expiresAt is in the past (reconstituted)', () => {
      const pastExpiresAt = new Date(Date.now() - 1000);
      const reconstituted = RefreshToken.reconstitute(
        RefreshTokenId.generate(),
        USER_ID,
        TOKEN_HASH,
        pastExpiresAt,
        null,
        new Date(Date.now() - 2000),
      );

      expect(reconstituted.isExpired()).toBe(true);
    });
  });

  describe('isRevoked()', () => {
    it('should return false for a freshly created token', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);

      expect(token.isRevoked()).toBe(false);
    });

    it('should return true after revoke()', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);
      token.revoke();

      expect(token.isRevoked()).toBe(true);
    });

    it('should return true for a reconstituted token with revokedAt set', () => {
      const reconstituted = RefreshToken.reconstitute(
        RefreshTokenId.generate(),
        USER_ID,
        TOKEN_HASH,
        new Date(Date.now() + 60_000),
        new Date(),
        new Date(),
      );

      expect(reconstituted.isRevoked()).toBe(true);
    });
  });

  describe('isValid()', () => {
    it('should return true when not expired and not revoked', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);

      expect(token.isValid()).toBe(true);
    });

    it('should return false when expired and not revoked', () => {
      const reconstituted = RefreshToken.reconstitute(
        RefreshTokenId.generate(),
        USER_ID,
        TOKEN_HASH,
        new Date(Date.now() - 1000),
        null,
        new Date(Date.now() - 2000),
      );

      expect(reconstituted.isValid()).toBe(false);
    });

    it('should return false when not expired but revoked', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);
      token.revoke();

      expect(token.isValid()).toBe(false);
    });

    it('should return false when both expired and revoked', () => {
      const reconstituted = RefreshToken.reconstitute(
        RefreshTokenId.generate(),
        USER_ID,
        TOKEN_HASH,
        new Date(Date.now() - 1000),
        new Date(),
        new Date(Date.now() - 2000),
      );

      expect(reconstituted.isValid()).toBe(false);
    });
  });

  describe('reconstitute()', () => {
    it('should produce an aggregate with no pending domain events', () => {
      const token = RefreshToken.reconstitute(
        RefreshTokenId.generate(),
        USER_ID,
        TOKEN_HASH,
        new Date(Date.now() + 60_000),
        null,
        new Date(),
      );

      expect(token.domainEvents).toHaveLength(0);
    });
  });

  describe('toPrimitives()', () => {
    it('should expose all fields as a record', () => {
      const token = RefreshToken.create(USER_ID, TOKEN_HASH, 60_000);
      const primitives = token.toPrimitives();

      expect(primitives.id).toBe(token.id.toValue());
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.tokenHash).toBe(TOKEN_HASH);
      expect(primitives.expiresAt).toBe(token.expiresAt);
      expect(primitives.revokedAt).toBeNull();
      expect(primitives.createdAt).toBe(token.createdAt);
    });
  });
});
