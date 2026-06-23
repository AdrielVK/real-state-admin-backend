import type { ProfileId } from '../value-objects/profile-id.value-object';
import { Profile } from './profile.aggregate';

export class ClientProfile extends Profile<ProfileId> {
  private constructor(userId: string) {
    super(userId);
  }

  static create(userId: string): ClientProfile {
    return new ClientProfile(userId);
  }
}
