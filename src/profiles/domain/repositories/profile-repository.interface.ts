import type { Profile } from '../entities/profile.aggregate';
import type { ProfileId } from '../value-objects/profile-id.value-object';

export interface IProfileRepository {
  findByUserId(userId: string): Promise<Profile<ProfileId> | null>;
  save(profile: Profile<ProfileId>): Promise<Profile<ProfileId>>;
}

export const IProfileRepositoryToken = Symbol('IProfileRepository');
