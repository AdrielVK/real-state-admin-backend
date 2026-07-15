import type { UserRole } from '@shared/domain';

export interface BusinessUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
