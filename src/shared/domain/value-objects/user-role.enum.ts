export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  CLIENT = 'CLIENT',
  VISITOR = 'VISITOR',
}

export const UserRoleHelpers = {
  implies(role: UserRole, other: UserRole): boolean {
    if (
      role === UserRole.ADMIN &&
      (other === UserRole.AGENT || other === UserRole.ADMINISTRATIVE)
    ) {
      return true;
    }
    return false;
  },

  isWorker(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.AGENT || role === UserRole.ADMINISTRATIVE;
  },

  canAccessCommercial(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.AGENT;
  },

  canAccessContracts(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.ADMINISTRATIVE;
  },
} as const;
