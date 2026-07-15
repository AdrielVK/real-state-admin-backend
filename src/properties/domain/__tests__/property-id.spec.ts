import { DomainException, ErrorCode } from '@shared/domain';

import { PropertyId } from '../value-objects/property-id.value-object';

describe('PropertyId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should create a PropertyId with a valid UUID', () => {
    const id = new PropertyId(validUuid);
    expect(id.toValue()).toBe(validUuid);
  });

  it('should throw DomainException for invalid UUID format', () => {
    expect(() => new PropertyId('not-a-uuid')).toThrow(DomainException);
    try {
      new PropertyId('not-a-uuid');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainException);
      expect((error as DomainException).code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should throw DomainException for empty string', () => {
    expect(() => new PropertyId('')).toThrow(DomainException);
  });

  it('should be equal to another PropertyId with the same UUID', () => {
    const id1 = new PropertyId(validUuid);
    const id2 = new PropertyId(validUuid);
    expect(id1.equals(id2)).toBe(true);
  });

  it('should NOT be equal to another PropertyId with a different UUID', () => {
    const id1 = new PropertyId(validUuid);
    const id2 = new PropertyId('660e8400-e29b-41d4-a716-446655440000');
    expect(id1.equals(id2)).toBe(false);
  });

  describe('PropertyId.generate()', () => {
    it('should return a valid PropertyId instance', () => {
      const id = PropertyId.generate();
      expect(id).toBeInstanceOf(PropertyId);
    });

    it('should return a value that matches UUID v4 format', () => {
      const id = PropertyId.generate();
      const value = id.toValue();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(value).toMatch(uuidV4Regex);
    });

    it('should produce a different UUID on each call', () => {
      const id1 = PropertyId.generate();
      const id2 = PropertyId.generate();
      expect(id1.toValue()).not.toBe(id2.toValue());
    });

    it('should produce a value accepted by the constructor', () => {
      const id = PropertyId.generate();
      expect(() => new PropertyId(id.toValue())).not.toThrow();
    });
  });
});
