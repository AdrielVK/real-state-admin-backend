// Mock the generated Prisma client to avoid import.meta issues in Jest
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

import { User } from '../../domain/entities/user.aggregate';
import { UserPasswordChangedEvent } from '../../domain/events/user-password-changed.event';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { UserEmail } from '../../domain/value-objects/user-email.value-object';
import { UserId } from '../../domain/value-objects/user-id.value-object';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

function createMockPrismaService() {
  return {
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };
}

const prismaUserRecord = {
  id: validUuid,
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  firstName: 'John',
  lastName: 'Doe',
  role: 'ADMIN' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

function makeReconstitutedUser(): User {
  return User.reconstitute(
    new UserId(validUuid),
    new UserEmail('test@example.com'),
    'hashed-password',
    'John',
    'Doe',
    UserRole.ADMIN,
    new Date('2024-01-01'),
    new Date('2024-01-02'),
  );
}

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    repository = new PrismaUserRepository(mockPrisma as never);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(prismaUserRecord);

      const result = await repository.findById(new UserId(validUuid));

      expect(result).toBeInstanceOf(User);
      expect(result!.id.toValue()).toBe(validUuid);
      expect(result!.email.value).toBe('test@example.com');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: validUuid },
      });
    });

    it('should return null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(new UserId(validUuid));

      expect(result).toBeNull();
    });

    it('should return a User with no pending domain events', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(prismaUserRecord);

      const result = await repository.findById(new UserId(validUuid));

      expect(result!.domainEvents).toHaveLength(0);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(prismaUserRecord);

      const result = await repository.findByEmail(new UserEmail('test@example.com'));

      expect(result).toBeInstanceOf(User);
      expect(result!.email.value).toBe('test@example.com');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('save', () => {
    it('should call prisma.user.upsert with correct data', async () => {
      mockPrisma.user.upsert.mockResolvedValue(prismaUserRecord);

      const user = makeReconstitutedUser();

      const result = await repository.save(user);

      expect(result).toBeInstanceOf(User);
      expect(result.id.toValue()).toBe(validUuid);
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: validUuid },
          create: expect.objectContaining({ id: validUuid, email: 'test@example.com' }),
        }),
      );
    });

    it('should return the same aggregate instance after save', async () => {
      mockPrisma.user.upsert.mockResolvedValue(prismaUserRecord);

      const user = makeReconstitutedUser();
      const result = await repository.save(user);

      expect(result).toBe(user);
    });

    it('should clear pending domain events on the aggregate after save', async () => {
      mockPrisma.user.upsert.mockResolvedValue(prismaUserRecord);

      const user = makeReconstitutedUser();
      user.addDomainEvent(new UserRegisteredEvent(validUuid, 'test@example.com', UserRole.ADMIN));
      user.addDomainEvent(new UserPasswordChangedEvent(validUuid));
      expect(user.domainEvents).toHaveLength(2);

      await repository.save(user);

      expect(user.domainEvents).toHaveLength(0);
    });
  });
});
