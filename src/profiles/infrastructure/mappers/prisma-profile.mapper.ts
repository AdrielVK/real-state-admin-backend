import { UserRole } from '@shared/domain/value-objects/user-role.enum';

import type { ProfileModel } from '../../../generated/prisma/models';
import { AdminProfile } from '../../domain/entities/admin-profile.aggregate';
import { AdministrativeProfile } from '../../domain/entities/administrative-profile.aggregate';
import { AgentProfile } from '../../domain/entities/agent-profile.aggregate';
import { ClientProfile } from '../../domain/entities/client-profile.aggregate';
import type { Profile } from '../../domain/entities/profile.aggregate';
import { VisitorProfile } from '../../domain/entities/visitor-profile.aggregate';
import type { ProfileId } from '../../domain/value-objects/profile-id.value-object';

interface ProfileConstructor {
  reconstitute(
    profileId: string,
    userId: string,
    createdAt: Date,
    updatedAt: Date,
  ): Profile<ProfileId>;
}

const ROLE_TO_CONCRETE: Record<UserRole, ProfileConstructor> = {
  [UserRole.ADMIN]: AdminProfile,
  [UserRole.AGENT]: AgentProfile,
  [UserRole.ADMINISTRATIVE]: AdministrativeProfile,
  [UserRole.CLIENT]: ClientProfile,
  [UserRole.VISITOR]: VisitorProfile,
};

function roleFromClass(profile: Profile<ProfileId>): UserRole {
  if (profile instanceof AdminProfile) {
    return UserRole.ADMIN;
  }
  if (profile instanceof AgentProfile) {
    return UserRole.AGENT;
  }
  if (profile instanceof AdministrativeProfile) {
    return UserRole.ADMINISTRATIVE;
  }
  if (profile instanceof ClientProfile) {
    return UserRole.CLIENT;
  }
  if (profile instanceof VisitorProfile) {
    return UserRole.VISITOR;
  }
  throw new Error(`Unknown profile class: ${profile.constructor.name}`);
}

export const PrismaProfileMapper = {
  toDomain(prismaProfile: ProfileModel): Profile<ProfileId> {
    const concrete = ROLE_TO_CONCRETE[prismaProfile.role];
    // Defensive runtime check — protects against DB rows with corrupted/legacy roles.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!concrete) {
      throw new Error(`Unknown profile role: ${prismaProfile.role}`);
    }
    return concrete.reconstitute(
      prismaProfile.id,
      prismaProfile.userId,
      prismaProfile.createdAt,
      prismaProfile.updatedAt,
    );
  },

  toPrisma(profile: Profile<ProfileId>): {
    id: string;
    userId: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: profile.id.toValue(),
      userId: profile.userId,
      role: roleFromClass(profile),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  },
};
