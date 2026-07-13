import { UserRole } from '@shared/domain/value-objects/user-role.enum';

import { AdminProfile } from '../../domain/entities/admin-profile.aggregate';
import { AdministrativeProfile } from '../../domain/entities/administrative-profile.aggregate';
import { AgentProfile } from '../../domain/entities/agent-profile.aggregate';
import { ClientProfile } from '../../domain/entities/client-profile.aggregate';
import { Profile } from '../../domain/entities/profile.aggregate';
import { VisitorProfile } from '../../domain/entities/visitor-profile.aggregate';
import { ProfileId } from '../../domain/value-objects/profile-id.value-object';
import { PrismaProfileMapper } from '../mappers/prisma-profile.mapper';

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

function makeRecord(overrides: Partial<PrismaProfileRecord> = {}): PrismaProfileRecord {
  return {
    id: VALID_UUID,
    userId: USER_ID,
    role: UserRole.VISITOR,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

describe('PrismaProfileMapper', () => {
  describe('toDomain()', () => {
    it('should map a Prisma profile to a base Profile via reconstitute (no events)', () => {
      const profile = PrismaProfileMapper.toDomain(makeRecord());

      expect(profile).toBeInstanceOf(Profile);
      expect(profile.id).toBeInstanceOf(ProfileId);
      expect(profile.id.toValue()).toBe(VALID_UUID);
      expect(profile.userId).toBe(USER_ID);
      expect(profile.createdAt).toBe(CREATED_AT);
      expect(profile.updatedAt).toBe(UPDATED_AT);
      expect(profile.domainEvents).toHaveLength(0);
    });

    it('should map role ADMIN to AdminProfile', () => {
      const profile = PrismaProfileMapper.toDomain(makeRecord({ role: UserRole.ADMIN }));
      expect(profile).toBeInstanceOf(AdminProfile);
    });

    it('should map role AGENT to AgentProfile', () => {
      const profile = PrismaProfileMapper.toDomain(makeRecord({ role: UserRole.AGENT }));
      expect(profile).toBeInstanceOf(AgentProfile);
    });

    it('should map role ADMINISTRATIVE to AdministrativeProfile', () => {
      const profile = PrismaProfileMapper.toDomain(makeRecord({ role: UserRole.ADMINISTRATIVE }));
      expect(profile).toBeInstanceOf(AdministrativeProfile);
    });

    it('should map role CLIENT to ClientProfile', () => {
      const profile = PrismaProfileMapper.toDomain(makeRecord({ role: UserRole.CLIENT }));
      expect(profile).toBeInstanceOf(ClientProfile);
    });

    it('should map role VISITOR to VisitorProfile', () => {
      const profile = PrismaProfileMapper.toDomain(makeRecord({ role: UserRole.VISITOR }));
      expect(profile).toBeInstanceOf(VisitorProfile);
    });

    it('should throw on an unknown role', () => {
      expect(() => {
        PrismaProfileMapper.toDomain(makeRecord({ role: 'GHOST' as UserRole }));
      }).toThrow();
    });
  });

  describe('toPrisma()', () => {
    it('should serialize a domain profile into a Prisma-shaped object with role derived from the concrete class', () => {
      const profile = AgentProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);

      const prismaInput = PrismaProfileMapper.toPrisma(profile);

      expect(prismaInput).toEqual({
        id: VALID_UUID,
        userId: USER_ID,
        role: UserRole.AGENT,
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      });
    });

    it.each([
      [AdminProfile, UserRole.ADMIN],
      [AgentProfile, UserRole.AGENT],
      [AdministrativeProfile, UserRole.ADMINISTRATIVE],
      [ClientProfile, UserRole.CLIENT],
      [VisitorProfile, UserRole.VISITOR],
    ] as const)('should derive role %s from %s', (ProfileClass, expectedRole) => {
      const profile = ProfileClass.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
      const prismaInput = PrismaProfileMapper.toPrisma(profile);
      expect(prismaInput.role).toBe(expectedRole);
    });
  });

  describe('round-trip', () => {
    it.each([
      [UserRole.ADMIN, AdminProfile],
      [UserRole.AGENT, AgentProfile],
      [UserRole.ADMINISTRATIVE, AdministrativeProfile],
      [UserRole.CLIENT, ClientProfile],
      [UserRole.VISITOR, VisitorProfile],
    ] as const)(
      'should preserve all fields for role %s across a toDomain → toPrisma → toDomain cycle',
      (role, ExpectedClass) => {
        const initial = makeRecord({ role });

        const domain = PrismaProfileMapper.toDomain(initial);
        const prisma = PrismaProfileMapper.toPrisma(domain);
        const roundTripped = PrismaProfileMapper.toDomain(prisma as PrismaProfileRecord);

        expect(roundTripped).toBeInstanceOf(ExpectedClass);
        expect(roundTripped.id.toValue()).toBe(initial.id);
        expect(roundTripped.userId).toBe(initial.userId);
        expect(roundTripped.createdAt).toBe(initial.createdAt);
        expect(roundTripped.updatedAt).toBe(initial.updatedAt);
      },
    );
  });
});
