import { UserRole, UserRoleHelpers } from '@shared/domain/value-objects/user-role.enum';

describe('UserRoleHelpers', () => {
  describe('implies()', () => {
    it('ADMIN implies AGENT', () => {
      expect(UserRoleHelpers.implies(UserRole.ADMIN, UserRole.AGENT)).toBe(true);
    });

    it('ADMIN implies ADMINISTRATIVE', () => {
      expect(UserRoleHelpers.implies(UserRole.ADMIN, UserRole.ADMINISTRATIVE)).toBe(true);
    });

    it('ADMIN does NOT imply CLIENT', () => {
      expect(UserRoleHelpers.implies(UserRole.ADMIN, UserRole.CLIENT)).toBe(false);
    });

    it('ADMIN does NOT imply VISITOR', () => {
      expect(UserRoleHelpers.implies(UserRole.ADMIN, UserRole.VISITOR)).toBe(false);
    });

    it('AGENT does NOT imply ADMIN', () => {
      expect(UserRoleHelpers.implies(UserRole.AGENT, UserRole.ADMIN)).toBe(false);
    });

    it('AGENT does NOT imply ADMINISTRATIVE', () => {
      expect(UserRoleHelpers.implies(UserRole.AGENT, UserRole.ADMINISTRATIVE)).toBe(false);
    });

    it('AGENT does NOT imply anything', () => {
      expect(UserRoleHelpers.implies(UserRole.AGENT, UserRole.CLIENT)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.AGENT, UserRole.VISITOR)).toBe(false);
    });

    it('ADMINISTRATIVE does NOT imply anything', () => {
      expect(UserRoleHelpers.implies(UserRole.ADMINISTRATIVE, UserRole.ADMIN)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.ADMINISTRATIVE, UserRole.AGENT)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.ADMINISTRATIVE, UserRole.CLIENT)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.ADMINISTRATIVE, UserRole.VISITOR)).toBe(false);
    });

    it('CLIENT does NOT imply anything', () => {
      expect(UserRoleHelpers.implies(UserRole.CLIENT, UserRole.ADMIN)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.CLIENT, UserRole.AGENT)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.CLIENT, UserRole.ADMINISTRATIVE)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.CLIENT, UserRole.VISITOR)).toBe(false);
    });

    it('VISITOR does NOT imply anything', () => {
      expect(UserRoleHelpers.implies(UserRole.VISITOR, UserRole.ADMIN)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.VISITOR, UserRole.AGENT)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.VISITOR, UserRole.ADMINISTRATIVE)).toBe(false);
      expect(UserRoleHelpers.implies(UserRole.VISITOR, UserRole.CLIENT)).toBe(false);
    });
  });

  describe('isWorker()', () => {
    it('ADMIN is a worker', () => {
      expect(UserRoleHelpers.isWorker(UserRole.ADMIN)).toBe(true);
    });

    it('AGENT is a worker', () => {
      expect(UserRoleHelpers.isWorker(UserRole.AGENT)).toBe(true);
    });

    it('ADMINISTRATIVE is a worker', () => {
      expect(UserRoleHelpers.isWorker(UserRole.ADMINISTRATIVE)).toBe(true);
    });

    it('CLIENT is NOT a worker', () => {
      expect(UserRoleHelpers.isWorker(UserRole.CLIENT)).toBe(false);
    });

    it('VISITOR is NOT a worker', () => {
      expect(UserRoleHelpers.isWorker(UserRole.VISITOR)).toBe(false);
    });
  });

  describe('canAccessCommercial()', () => {
    it('ADMIN can access commercial', () => {
      expect(UserRoleHelpers.canAccessCommercial(UserRole.ADMIN)).toBe(true);
    });

    it('AGENT can access commercial', () => {
      expect(UserRoleHelpers.canAccessCommercial(UserRole.AGENT)).toBe(true);
    });

    it('ADMINISTRATIVE cannot access commercial', () => {
      expect(UserRoleHelpers.canAccessCommercial(UserRole.ADMINISTRATIVE)).toBe(false);
    });

    it('CLIENT cannot access commercial', () => {
      expect(UserRoleHelpers.canAccessCommercial(UserRole.CLIENT)).toBe(false);
    });

    it('VISITOR cannot access commercial', () => {
      expect(UserRoleHelpers.canAccessCommercial(UserRole.VISITOR)).toBe(false);
    });
  });

  describe('canAccessContracts()', () => {
    it('ADMIN can access contracts', () => {
      expect(UserRoleHelpers.canAccessContracts(UserRole.ADMIN)).toBe(true);
    });

    it('ADMINISTRATIVE can access contracts', () => {
      expect(UserRoleHelpers.canAccessContracts(UserRole.ADMINISTRATIVE)).toBe(true);
    });

    it('AGENT cannot access contracts', () => {
      expect(UserRoleHelpers.canAccessContracts(UserRole.AGENT)).toBe(false);
    });

    it('CLIENT cannot access contracts', () => {
      expect(UserRoleHelpers.canAccessContracts(UserRole.CLIENT)).toBe(false);
    });

    it('VISITOR cannot access contracts', () => {
      expect(UserRoleHelpers.canAccessContracts(UserRole.VISITOR)).toBe(false);
    });
  });
});
