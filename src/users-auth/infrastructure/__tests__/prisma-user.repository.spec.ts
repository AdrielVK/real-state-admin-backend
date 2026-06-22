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

import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
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

      const user = User.create({
        id: new UserId(validUuid),
        email: new UserEmail('test@example.com'),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ADMIN,
        passwordHash: 'hashed-password',
      });

      const result = await repository.save(user);

      expect(result).toBeInstanceOf(User);
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: validUuid },
          create: expect.objectContaining({ id: validUuid, email: 'test@example.com' }),
        }),
      );
    });
  });
});
