import { UserRole } from '@shared/domain/value-objects/user-role.enum';

import { User } from '../entities/user.entity';
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

    it('should assign VISITOR as default role', async () => {
      const hasher = makeMockHasher();
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);

      expect(user.role).toBe(UserRole.VISITOR);
    });

    it('should hash the password via the hasher', async () => {
      const hasher = makeMockHasher('hashed-secure-1');

      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);

      expect(hasher.hash).toHaveBeenCalledWith(VALID_PASSWORD);
      expect(user.passwordHash).toBe('hashed-secure-1');
    });

    it('should set createdAt and updatedAt close to now', async () => {
      const hasher = makeMockHasher();
      const before = new Date();
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);
      const after = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(user.updatedAt.getTime()).toBe(user.createdAt.getTime());
    });

    it('should emit a single UserRegisteredEvent with correct payload', async () => {
      const hasher = makeMockHasher();

      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);

      const events = user.domainEvents;
      expect(events).toHaveLength(1);
      const event = events[0] as UserRegisteredEvent;
      expect(event).toBeInstanceOf(UserRegisteredEvent);
      expect(event.aggregateId).toBe(user.id.toValue());
      expect(event.userId).toBe(user.id.toValue());
      expect(event.email).toBe('test@example.com');
      expect(event.role).toBe(UserRole.VISITOR);
      expect(event.eventName).toBe('identity.user.registered');
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

    it('should update updatedAt to a more recent date', async () => {
      const user = makeUser();
      const originalUpdatedAt = user.updatedAt;
      const hasher = makeMockHasher();

      // ensure measurable time difference
      await new Promise((r) => setTimeout(r, 5));
      await user.changePassword(VALID_PASSWORD, hasher);

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should emit a single UserPasswordChangedEvent', async () => {
      const user = makeUser();
      const hasher = makeMockHasher();

      await user.changePassword(VALID_PASSWORD, hasher);

      const events = user.domainEvents;
      expect(events).toHaveLength(1);
      const event = events[0] as UserPasswordChangedEvent;
      expect(event).toBeInstanceOf(UserPasswordChangedEvent);
      expect(event.aggregateId).toBe(VALID_UUID);
      expect(event.eventName).toBe('user.passwordChanged');
    });

    it('should accumulate events across operations', async () => {
      const hasher = makeMockHasher();
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);
      // registration event is already there
      expect(user.domainEvents).toHaveLength(1);

      await user.changePassword(VALID_PASSWORD, hasher);

      expect(user.domainEvents).toHaveLength(2);
      expect(user.domainEvents[0]).toBeInstanceOf(UserRegisteredEvent);
      expect(user.domainEvents[1]).toBeInstanceOf(UserPasswordChangedEvent);
    });
  });

  describe('clearEvents() (inherited)', () => {
    it('should clear pending events', async () => {
      const hasher = makeMockHasher();
      const user = await User.register(VALID_EMAIL, VALID_PASSWORD, 'John', 'Doe', hasher);

      expect(user.domainEvents.length).toBeGreaterThan(0);
      user.clearEvents();
      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('toPrimitives()', () => {
    it('should expose all fields as a record', () => {
      const id = new UserId(VALID_UUID);
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const user = User.reconstitute(
        id,
        VALID_EMAIL,
        'hashed',
        'John',
        'Doe',
        UserRole.ADMIN,
        createdAt,
        updatedAt,
      );

      const primitives = user.toPrimitives();
      expect(primitives.id).toBe(VALID_UUID);
      expect(primitives.email).toBe('test@example.com');
      expect(primitives.firstName).toBe('John');
      expect(primitives.lastName).toBe('Doe');
      expect(primitives.role).toBe(UserRole.ADMIN);
      expect(primitives.passwordHash).toBe('hashed');
      expect(primitives.createdAt).toBe(createdAt);
      expect(primitives.updatedAt).toBe(updatedAt);
    });
  });
});
