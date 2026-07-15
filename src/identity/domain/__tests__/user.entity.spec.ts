import { UserRole } from '@shared/domain/value-objects/user-role.enum';

import { User } from '../entities/user.aggregate';
import { UserStatus } from '../enums/user-status.enum';
import { UserPasswordChangedEvent } from '../events/user-password-changed.event';
import { UserRegisteredEvent } from '../events/user-registered.event';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import { PlainPassword } from '../value-objects/plain-password.value-object';
import { UserEmail } from '../value-objects/user-email.value-object';
import { UserId } from '../value-objects/user-id.value-object';

function makeMockHasher(hashOverride = 'hashed-password'): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn().mockResolvedValue(hashOverride),
    compare: jest.fn().mockResolvedValue(true),
  } as jest.Mocked<IPasswordHasher>;
}

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_PASSWORD = PlainPassword.create('Secure1!');
const VALID_EMAIL = new UserEmail('test@example.com');

describe('User AggregateRoot', () => {
  describe('reconstitute()', () => {
    it('should reconstitute a User from persisted data with no events', () => {
      const id = new UserId(VALID_UUID);
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const user = User.reconstitute(
        id,
        VALID_EMAIL,
        'hashed-pwd',
        'John',
        'Doe',
        UserRole.ADMIN,
        UserStatus.ACTIVE,
        createdAt,
        updatedAt,
      );

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(id);
      expect(user.email).toBe(VALID_EMAIL);
      expect(user.passwordHash).toBe('hashed-pwd');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.createdAt).toBe(createdAt);
      expect(user.updatedAt).toBe(updatedAt);
      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('register()', () => {
    it('should create a User with a generated UUID v4', async () => {
      const hasher = makeMockHasher();
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(user.id.toValue()).toMatch(uuidV4Regex);
    });

    it('should produce a different User on each call', async () => {
      const hasher = makeMockHasher();
      const a = await User.register(VALID_EMAIL, VALID_PASSWORD, 'A', 'A', hasher);
      const b = await User.register(VALID_EMAIL, VALID_PASSWORD, 'A', 'A', hasher);
      expect(a.id.toValue()).not.toBe(b.id.toValue());
    });

    it('should assign VISITOR role and ACTIVE status', async () => {
      const hasher = makeMockHasher();
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);
      expect(user.role).toBe(UserRole.VISITOR);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should hash the password via the hasher', async () => {
      const hasher = makeMockHasher('hashed-secure-1');
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);
      expect(hasher.hash).toHaveBeenCalledWith(VALID_PASSWORD);
      expect(user.passwordHash).toBe('hashed-secure-1');
    });

    it('should emit a single UserRegisteredEvent with VISITOR role', async () => {
      const hasher = makeMockHasher();
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);
      const events = user.domainEvents;
      expect(events).toHaveLength(1);
      const event = events[0] as UserRegisteredEvent;
      expect(event).toBeInstanceOf(UserRegisteredEvent);
      expect(event.role).toBe(UserRole.VISITOR);
      expect(event.eventName).toBe('identity.user.registered');
    });
  });

  describe('createBusinessUser()', () => {
    it('should create a User with the specified role', async () => {
      const hasher = makeMockHasher();
      const user = await User.createBusinessUser(
        VALID_EMAIL,
        VALID_PASSWORD,
        'Agent',
        'User',
        UserRole.AGENT,
        hasher,
      );
      expect(user.role).toBe(UserRole.AGENT);
    });

    it('should set status to PENDING_PASSWORD_CHANGE', async () => {
      const hasher = makeMockHasher();
      const user = await User.createBusinessUser(
        VALID_EMAIL,
        VALID_PASSWORD,
        'Admin',
        'User',
        UserRole.ADMINISTRATIVE,
        hasher,
      );
      expect(user.status).toBe(UserStatus.PENDING_PASSWORD_CHANGE);
    });

    it('should emit UserRegisteredEvent with the business role', async () => {
      const hasher = makeMockHasher();
      const user = await User.createBusinessUser(
        VALID_EMAIL,
        VALID_PASSWORD,
        'Agent',
        'User',
        UserRole.AGENT,
        hasher,
      );
      const event = user.domainEvents[0] as UserRegisteredEvent;
      expect(event.role).toBe(UserRole.AGENT);
    });
  });

  describe('changePassword()', () => {
    function makeUser(): User {
      return User.reconstitute(
        new UserId(VALID_UUID),
        VALID_EMAIL,
        'old-hash',
        'John',
        'Doe',
        UserRole.VISITOR,
        UserStatus.PENDING_PASSWORD_CHANGE,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
    }

    it('should hash the new password via the hasher', async () => {
      const user = makeUser();
      const hasher = makeMockHasher('new-hash');
      await user.changePassword(VALID_PASSWORD, hasher);
      expect(hasher.hash).toHaveBeenCalledWith(VALID_PASSWORD);
      expect(user.passwordHash).toBe('new-hash');
    });

    it('should set status to ACTIVE after password change', async () => {
      const user = makeUser();
      const hasher = makeMockHasher();
      await user.changePassword(VALID_PASSWORD, hasher);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should emit a single UserPasswordChangedEvent', async () => {
      const user = makeUser();
      const hasher = makeMockHasher();
      await user.changePassword(VALID_PASSWORD, hasher);
      const events = user.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserPasswordChangedEvent);
    });
  });

  describe('toPrimitives()', () => {
    it('should expose all fields including status', () => {
      const id = new UserId(VALID_UUID);
      const user = User.reconstitute(
        id,
        VALID_EMAIL,
        'hashed',
        'John',
        'Doe',
        UserRole.ADMIN,
        UserStatus.ACTIVE,
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      );
      const primitives = user.toPrimitives();
      expect(primitives.status).toBe(UserStatus.ACTIVE);
    });
  });
});
