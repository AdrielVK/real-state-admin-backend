import { DomainException, ErrorCode, Result, UserRole } from '@shared/domain';

import type { ProfileId } from '../value-objects/profile-id.value-object';
import { Profile } from './profile.aggregate';

export class AdminProfile extends Profile<ProfileId> {
  private constructor(userId: string) {
    super(userId);
  }

  static create(userId: string): AdminProfile {
    return new AdminProfile(userId);
  }

  static canCreateBusinessUser(actor: UserRole, target: UserRole): Result<void, DomainException> {
    if (actor !== UserRole.ADMIN) {
      return Result.fail(
        new DomainException(
          'Solo un administrador puede crear usuarios del negocio',
          ErrorCode.FORBIDDEN,
        ),
      );
    }
    if (target !== UserRole.AGENT && target !== UserRole.ADMINISTRATIVE) {
      return Result.fail(
        new DomainException(
          'El rol destino debe ser AGENT o ADMINISTRATIVE',
          ErrorCode.VALIDATION_ERROR,
        ),
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type, @typescript-eslint/no-unnecessary-type-assertion
    return Result.ok<void, DomainException>(undefined as unknown as void);
  }
}
