import { Reflector } from '@nestjs/core';

import { UserRole } from '@shared/domain';

import { RolesGuard } from '../guards/roles.guard';

function makeContext(role: string | undefined, metadataRoles: string[] | undefined) {
  const reflector = new Reflector();
  reflector.getAllAndOverride = jest.fn().mockReturnValue(metadataRoles);

  const request = role ? { user: { role } } : { user: undefined };

  return {
    guard: new RolesGuard(reflector),
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };
}

describe('RolesGuard', () => {
  it('should allow when no roles are required', () => {
    const { guard, ...context } = makeContext();
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should allow when roles are empty', () => {
    const { guard, ...context } = makeContext(UserRole.ADMIN, []);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should deny when user has no role', () => {
    const { guard, ...context } = makeContext(undefined, [UserRole.ADMIN]);
    expect(guard.canActivate(context as any)).toBe(false);
  });

  it('should allow exact role match', () => {
    const { guard, ...context } = makeContext(UserRole.AGENT, [UserRole.AGENT]);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should deny when role does not match', () => {
    const { guard, ...context } = makeContext(UserRole.VISITOR, [UserRole.ADMIN]);
    expect(guard.canActivate(context as any)).toBe(false);
  });

  it('should allow ADMIN via implies() for AGENT', () => {
    const { guard, ...context } = makeContext(UserRole.ADMIN, [UserRole.AGENT]);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should allow ADMIN via implies() for ADMINISTRATIVE', () => {
    const { guard, ...context } = makeContext(UserRole.ADMIN, [UserRole.ADMINISTRATIVE]);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('should allow when any required role matches', () => {
    const { guard, ...context } = makeContext(UserRole.AGENT, [UserRole.ADMIN, UserRole.AGENT]);
    expect(guard.canActivate(context as any)).toBe(true);
  });
});
