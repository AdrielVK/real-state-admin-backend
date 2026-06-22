import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { UserEmail } from '../value-objects/user-email.value-object';
import { UserId } from '../value-objects/user-id.value-object';

describe('User entity', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  it('should create a User with valid props', () => {
    const user = User.create({
      id: new UserId(validId),
      email: new UserEmail('test@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
      passwordHash: 'hashed-password',
    });
    expect(user.email.value).toBe('test@example.com');
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.role).toBe(UserRole.CLIENT);
  });

  it('should be equal to another User with the same id', () => {
    const id = new UserId(validId);
    const user1 = User.create({
      id,
      email: new UserEmail('test@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
      passwordHash: 'hash',
    });
    const user2 = User.create({
      id,
      email: new UserEmail('other@example.com'),
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.ADMIN,
      passwordHash: 'hash2',
    });
    expect(user1.equals(user2)).toBe(true);
  });

  it('should NOT be equal to another User with a different id', () => {
    const user1 = User.create({
      id: new UserId(validId),
      email: new UserEmail('test@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
      passwordHash: 'hash',
    });
    const user2 = User.create({
      id: new UserId('660e8400-e29b-41d4-a716-446655440000'),
      email: new UserEmail('test@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
      passwordHash: 'hash',
    });
    expect(user1.equals(user2)).toBe(false);
  });

  it('should return primitives via toPrimitives()', () => {
    const user = User.create({
      id: new UserId(validId),
      email: new UserEmail('test@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.ADMIN,
      passwordHash: 'hash',
    });
    const primitives = user.toPrimitives();
    expect(primitives.email).toBe('test@example.com');
    expect(primitives.firstName).toBe('John');
    expect(primitives.role).toBe(UserRole.ADMIN);
  });
});
