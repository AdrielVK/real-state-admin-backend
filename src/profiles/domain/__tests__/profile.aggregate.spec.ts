import { AdminProfile } from '../entities/admin-profile.aggregate';
import { AdministrativeProfile } from '../entities/administrative-profile.aggregate';
import { AgentProfile } from '../entities/agent-profile.aggregate';
import { ClientProfile } from '../entities/client-profile.aggregate';
import { VisitorProfile } from '../entities/visitor-profile.aggregate';
import { ProfileId } from '../value-objects/profile-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-uuid-1234';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-02-01T00:00:00.000Z');

describe('Profile.reconstitute()', () => {
  it('should reconstitute an AgentProfile with the given id, userId, and timestamps', () => {
    const profile = AgentProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);

    expect(profile).toBeInstanceOf(AgentProfile);
    expect(profile.id.toValue()).toBe(VALID_UUID);
    expect(profile.userId).toBe(USER_ID);
    expect(profile.createdAt).toBe(CREATED_AT);
    expect(profile.updatedAt).toBe(UPDATED_AT);
  });

  it('should produce a ProfileId wrapping the given id', () => {
    const profile = AdminProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);

    expect(profile.id).toBeInstanceOf(ProfileId);
  });

  it('should reconstitute AdminProfile', () => {
    const profile = AdminProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
    expect(profile).toBeInstanceOf(AdminProfile);
  });

  it('should reconstitute AdministrativeProfile', () => {
    const profile = AdministrativeProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
    expect(profile).toBeInstanceOf(AdministrativeProfile);
  });

  it('should reconstitute ClientProfile', () => {
    const profile = ClientProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
    expect(profile).toBeInstanceOf(ClientProfile);
  });

  it('should reconstitute VisitorProfile', () => {
    const profile = VisitorProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);
    expect(profile).toBeInstanceOf(VisitorProfile);
  });

  it('should not generate a new id — the provided id must be preserved', () => {
    const profile = AgentProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);

    expect(profile.id.toValue()).toBe(VALID_UUID);
  });

  it('should preserve provided timestamps without mutation', () => {
    const profile = AgentProfile.reconstitute(VALID_UUID, USER_ID, CREATED_AT, UPDATED_AT);

    expect(profile.createdAt).toBe(CREATED_AT);
    expect(profile.updatedAt).toBe(UPDATED_AT);
  });

  it('should reject an invalid UUID at reconstitute time', () => {
    expect(() => {
      AgentProfile.reconstitute('not-a-uuid', USER_ID, CREATED_AT, UPDATED_AT);
    }).toThrow('Invalid UUID format');
  });
});
