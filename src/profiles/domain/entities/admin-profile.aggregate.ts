import { Result, UserRole } from '@shared/domain';

import type { ProfileId } from '../value-objects/profile-id.value-object';
import { Profile } from './profile.aggregate';

export class AdminProfile extends Profile<ProfileId> {
  private constructor(userId: string) {
    super(userId);
  }

  static create(userId: string): AdminProfile {
    return new AdminProfile(userId);
  }

  static canCreateBusinessUser(
    _adminRole: UserRole,
    targetRole: UserRole,
  ): Result<void, { code: string; message: string }> {
    if (targetRole === UserRole.ADMIN) {
      return Result.fail({
        code: 'FORBIDDEN',
        message: 'No se puede crear un usuario con rol ADMIN',
      });
    }
    return Result.ok();
  }
}
