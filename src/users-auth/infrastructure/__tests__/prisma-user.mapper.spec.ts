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

import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

describe('PrismaUserMapper', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should map Prisma user to domain User', () => {
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
  });

  it('should map domain User to Prisma input', () => {
    const domainUser = User.create({
      id: new UserId(validUuid),
      email: new UserEmail('test@example.com'),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
      passwordHash: 'hashed-password',
    });

    const prismaInput = PrismaUserMapper.toPrisma(domainUser);

    expect(prismaInput.id).toBe(validUuid);
    expect(prismaInput.email).toBe('test@example.com');
    expect(prismaInput.passwordHash).toBe('hashed-password');
    expect(prismaInput.firstName).toBe('John');
    expect(prismaInput.role).toBe('CLIENT');
  });
});
