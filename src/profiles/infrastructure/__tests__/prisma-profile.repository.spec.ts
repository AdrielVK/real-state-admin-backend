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

import { AdminProfile } from '../../domain/entities/admin-profile.aggregate';
import { AgentProfile } from '../../domain/entities/agent-profile.aggregate';
import { Profile } from '../../domain/entities/profile.aggregate';
import { VisitorProfile } from '../../domain/entities/visitor-profile.aggregate';
import { PrismaProfileRepository } from '../repositories/prisma-profile.repository';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-uuid-9999';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-02-01T00:00:00.000Z');

interface PrismaProfileRecord {
  id: string;
  userId: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const prismaProfileRecord: PrismaProfileRecord = {
  id: VALID_UUID,
  userId: USER_ID,
  role: UserRole.AGENT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
};

function createMockPrismaService() {
  return {
    profile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
}

describe('PrismaProfileRepository', () => {
  let repository: PrismaProfileRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    repository = new PrismaProfileRepository(mockPrisma as never);
  });

  describe('findByUserId()', () => {
    it('should return null when no profile exists for the user', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(null);

      const result = await repository.findByUserId(USER_ID);

      expect(result).toBeNull();
      expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: USER_ID },
      });
    });

    it('should return a Profile aggregate when found', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(prismaProfileRecord);

      const result = await repository.findByUserId(USER_ID);

      expect(result).toBeInstanceOf(Profile);
      expect(result).toBeInstanceOf(AgentProfile);
      expect(result!.id.toValue()).toBe(VALID_UUID);
      expect(result!.userId).toBe(USER_ID);
    });

    it('should return a profile with no pending domain events', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue(prismaProfileRecord);

      const result = await repository.findByUserId(USER_ID);

      expect(result!.domainEvents).toHaveLength(0);
    });

    it('should return the right concrete subclass per role', async () => {
      mockPrisma.profile.findUnique.mockResolvedValue({
        ...prismaProfileRecord,
        role: UserRole.ADMIN,
      });

      const adminResult = await repository.findByUserId(USER_ID);
      expect(adminResult).toBeInstanceOf(AdminProfile);

      mockPrisma.profile.findUnique.mockResolvedValue({
        ...prismaProfileRecord,
        role: UserRole.VISITOR,
      });

      const visitorResult = await repository.findByUserId(USER_ID);
      expect(visitorResult).toBeInstanceOf(VisitorProfile);
    });
  });

  describe('save()', () => {
    it('should call prisma.profile.upsert with id as the unique key', async () => {
      mockPrisma.profile.upsert.mockResolvedValue(prismaProfileRecord);

      const profile = AgentProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
      await repository.save(profile);

      expect(mockPrisma.profile.upsert).toHaveBeenCalledTimes(1);
      const call = mockPrisma.profile.upsert.mock.calls[0]?.[0] as {
        where: { id: string };
        create: { id: string; userId: string; role: UserRole };
      };
      expect(call.where).toEqual({ id: VALID_UUID });
      expect(call.create.id).toBe(VALID_UUID);
      expect(call.create.userId).toBe(USER_ID);
      expect(call.create.role).toBe(UserRole.AGENT);
    });

    it('should return the same aggregate instance after save', async () => {
      mockPrisma.profile.upsert.mockResolvedValue(prismaProfileRecord);

      const profile = AgentProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
      const result = await repository.save(profile);

      expect(result).toBe(profile);
    });

    it('should clear pending domain events on the aggregate after save', async () => {
      mockPrisma.profile.upsert.mockResolvedValue(prismaProfileRecord);

      const profile = AgentProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
      profile.addDomainEvent({
        eventId: 'evt-1',
        occurredOn: new Date(),
        aggregateId: VALID_UUID,
        eventName: 'test.event',
      } as never);
      expect(profile.domainEvents).toHaveLength(1);

      await repository.save(profile);

      expect(profile.domainEvents).toHaveLength(0);
    });
  });
});
