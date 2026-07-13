import { DomainException, ErrorCode, UserRole } from '@shared/domain';

import { AdminProfile } from '../entities/admin-profile.aggregate';

describe('AdminProfile.canCreateBusinessUser()', () => {
  describe('allowed combinations', () => {
    it('should return Ok when ADMIN creates an AGENT', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, UserRole.AGENT);

      expect(result.isOk).toBe(true);
      expect(result.isFail).toBe(false);
    });

    it('should return Ok when ADMIN creates an ADMINISTRATIVE', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, UserRole.ADMINISTRATIVE);

      expect(result.isOk).toBe(true);
    });
  });

  describe('rejected combinations — non-admin actor', () => {
    it('should return Err when AGENT attempts to create an AGENT', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.AGENT, UserRole.AGENT);

      expect(result.isFail).toBe(true);
      const error = result.getError();
      expect(error).toBeInstanceOf(DomainException);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should return Err when VISITOR attempts to create an ADMINISTRATIVE', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.VISITOR, UserRole.ADMINISTRATIVE);

      expect(result.isFail).toBe(true);
      const error = result.getError();
      expect(error).toBeInstanceOf(DomainException);
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should return Err when CLIENT attempts to create an AGENT', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.CLIENT, UserRole.AGENT);

      expect(result.isFail).toBe(true);
      expect(result.getError().code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should return Err when ADMINISTRATIVE attempts to create an AGENT', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.ADMINISTRATIVE, UserRole.AGENT);

      expect(result.isFail).toBe(true);
      expect(result.getError().code).toBe(ErrorCode.FORBIDDEN);
    });
  });

  describe('rejected combinations — invalid target role', () => {
    it('should return Err when ADMIN attempts to create a CLIENT', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, UserRole.CLIENT);

      expect(result.isFail).toBe(true);
      const error = result.getError();
      expect(error).toBeInstanceOf(DomainException);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should return Err when ADMIN attempts to create a VISITOR', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, UserRole.VISITOR);

      expect(result.isFail).toBe(true);
      expect(result.getError().code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should return Err when ADMIN attempts to create another ADMIN', () => {
      const result = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, UserRole.ADMIN);

      expect(result.isFail).toBe(true);
      expect(result.getError().code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });

  describe('purity', () => {
    it('should be a pure static function with no side effects', () => {
      const a = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, UserRole.AGENT);
      const b = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, UserRole.AGENT);

      expect(a.isOk).toBe(b.isOk);
    });
  });
});
