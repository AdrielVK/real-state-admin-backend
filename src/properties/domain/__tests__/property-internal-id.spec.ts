import { DomainException, ErrorCode } from '@shared/domain';

import { PropertyInternalId } from '../value-objects/property-internal-id.value-object';

describe('PropertyInternalId', () => {
  it('should create an internal id with a valid 7-char alphanumeric string', () => {
    const id = PropertyInternalId.create('A1B2C3D');
    expect(id.value).toBe('A1B2C3D');
  });

  it('should accept lowercase input by normalizing to uppercase', () => {
    const id = PropertyInternalId.create('abc1234');
    expect(id.value).toBe('ABC1234');
  });

  it('should throw DomainException for strings shorter than 7 chars', () => {
    expect(() => PropertyInternalId.create('A1B2C3')).toThrow(DomainException);
    try {
      PropertyInternalId.create('A1B2C3');
    } catch (error) {
      expect((error as DomainException).code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should throw DomainException for strings longer than 7 chars', () => {
    expect(() => PropertyInternalId.create('A1B2C3D9')).toThrow(DomainException);
  });

  it('should throw DomainException for strings with non-alphanumeric characters', () => {
    expect(() => PropertyInternalId.create('A1B2C-D')).toThrow(DomainException);
    expect(() => PropertyInternalId.create('A1B2C D')).toThrow(DomainException);
    expect(() => PropertyInternalId.create('A1B2C.D')).toThrow(DomainException);
  });

  it('should throw DomainException for empty string', () => {
    expect(() => PropertyInternalId.create('')).toThrow(DomainException);
  });

  it('should throw DomainException for non-string input', () => {
    expect(() => PropertyInternalId.create(null as never)).toThrow(DomainException);
    expect(() => PropertyInternalId.create(undefined as never)).toThrow(DomainException);
    expect(() => PropertyInternalId.create(1_234_567 as never)).toThrow(DomainException);
  });

  it('should be equal to another internal id with the same value', () => {
    const a = PropertyInternalId.create('A1B2C3D');
    const b = PropertyInternalId.create('A1B2C3D');
    expect(a.equals(b)).toBe(true);
  });

  it('should NOT be equal to another internal id with a different value', () => {
    const a = PropertyInternalId.create('A1B2C3D');
    const b = PropertyInternalId.create('B2C3D4E');
    expect(a.equals(b)).toBe(false);
  });
});
