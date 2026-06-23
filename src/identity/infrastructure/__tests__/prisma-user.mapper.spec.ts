// Mock the generated Prisma client
class MockPrismaClient {
  async $connect(): Promise<void> {
    return;
  }
  async $disconnect(): Promise<void> {
    return;
  }
}

jest.mock('../../../generated/prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}));

import { UserRole } from '@shared/domain/value-objects/user-role.enum';

import { User } from '../../domain/entities/user.entity';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

describe('PrismaUserMapper', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should map Prisma user to domain User via reconstitute (no pending events)', () => {
    const prismaUser = {
      id: validUuid,
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMIN' as const,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const domainUser = PrismaUserMapper.toDomain(prismaUser);

    expect(domainUser).toBeInstanceOf(User);
    expect(domainUser.id.toValue()).toBe(validUuid);
    expect(domainUser.email.value).toBe('test@example.com');
    expect(domainUser.firstName).toBe('John');
    expect(domainUser.role).toBe(UserRole.ADMIN);
    expect(domainUser.domainEvents).toHaveLength(0);
  });

  it('should map domain User to Prisma input', () => {
    const domainUser = User.reconstitute(
      new UserId(validUuid),
      new UserEmail('test@example.com'),
      'hashed-password',
      'John',
      'Doe',
      UserRole.CLIENT,
      new Date('2024-01-01'),
      new Date('2024-01-02'),
    );

    const prismaInput = PrismaUserMapper.toPrisma(domainUser);

    expect(prismaInput.id).toBe(validUuid);
    expect(prismaInput.email).toBe('test@example.com');
    expect(prismaInput.passwordHash).toBe('hashed-password');
    expect(prismaInput.firstName).toBe('John');
    expect(prismaInput.role).toBe('CLIENT');
  });

  it('should support all 5 role values when mapping to domain', () => {
    const roles: readonly UserRole[] = [
      UserRole.ADMIN,
      UserRole.AGENT,
      UserRole.ADMINISTRATIVE,
      UserRole.CLIENT,
      UserRole.VISITOR,
    ];

    for (const role of roles) {
      const prismaUser = {
        id: validUuid,
        email: 'test@example.com',
        passwordHash: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        role: role as UserRole,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const user = PrismaUserMapper.toDomain(prismaUser);
      expect(user.role).toBe(role);
    }
  });
});
