import { UserRole } from '@shared/domain';

import type { Profile } from '../../domain';
import type { ProfileId } from '../../domain';
import {
  AdministrativeProfile,
  AdminProfile,
  AgentProfile,
  ClientProfile,
  VisitorProfile,
} from '../../domain/entities';

export function createProfileForRole(role: UserRole, userId: string): Profile<ProfileId> {
  const factories: Record<UserRole, (userId: string) => Profile<ProfileId>> = {
    [UserRole.ADMIN]: (id) => AdminProfile.create(id),
    [UserRole.AGENT]: (id) => AgentProfile.create(id),
    [UserRole.ADMINISTRATIVE]: (id) => AdministrativeProfile.create(id),
    [UserRole.CLIENT]: (id) => ClientProfile.create(id),
    [UserRole.VISITOR]: (id) => VisitorProfile.create(id),
  };
  const factory = factories[role];
  // Defensive runtime check — protects against invalid roles smuggled in via
  // event payloads (e.g. a stale or hand-crafted UserRegisteredEvent).
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!factory) {
    throw new Error(`Unknown role: ${role}`);
  }
  return factory(userId);
}
