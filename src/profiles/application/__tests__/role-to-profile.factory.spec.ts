import { UserRole } from '@shared/domain/value-objects/user-role.enum';

import { AdminProfile } from '../../domain/entities/admin-profile.aggregate';
import { AdministrativeProfile } from '../../domain/entities/administrative-profile.aggregate';
import { AgentProfile } from '../../domain/entities/agent-profile.aggregate';
import { ClientProfile } from '../../domain/entities/client-profile.aggregate';
import { Profile } from '../../domain/entities/profile.aggregate';
import { VisitorProfile } from '../../domain/entities/visitor-profile.aggregate';
import { createProfileForRole } from '../handlers/role-to-profile.factory';

const USER_ID = 'user-uuid-1234';

describe('createProfileForRole()', () => {
  it('should create an AdminProfile for ADMIN', () => {
    const profile = createProfileForRole(UserRole.ADMIN, USER_ID);
    expect(profile).toBeInstanceOf(AdminProfile);
  });

  it('should create an AgentProfile for AGENT', () => {
    const profile = createProfileForRole(UserRole.AGENT, USER_ID);
    expect(profile).toBeInstanceOf(AgentProfile);
  });

  it('should create an AdministrativeProfile for ADMINISTRATIVE', () => {
    const profile = createProfileForRole(UserRole.ADMINISTRATIVE, USER_ID);
    expect(profile).toBeInstanceOf(AdministrativeProfile);
  });

  it('should create a ClientProfile for CLIENT', () => {
    const profile = createProfileForRole(UserRole.CLIENT, USER_ID);
    expect(profile).toBeInstanceOf(ClientProfile);
  });

  it('should create a VisitorProfile for VISITOR', () => {
    const profile = createProfileForRole(UserRole.VISITOR, USER_ID);
    expect(profile).toBeInstanceOf(VisitorProfile);
  });

  it('should always return a Profile<ProfileId>', () => {
    const profile = createProfileForRole(UserRole.AGENT, USER_ID);
    expect(profile).toBeInstanceOf(Profile);
    expect(profile.userId).toBe(USER_ID);
  });

  it('should generate a fresh ProfileId for each call', () => {
    const a = createProfileForRole(UserRole.AGENT, USER_ID);
    const b = createProfileForRole(UserRole.AGENT, USER_ID);
    expect(a.id.toValue()).not.toBe(b.id.toValue());
  });

  it('should throw on an unknown role', () => {
    expect(() => {
      createProfileForRole('GHOST' as UserRole, USER_ID);
    }).toThrow(/Unknown role/);
  });
});
