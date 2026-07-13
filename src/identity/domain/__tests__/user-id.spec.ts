import { UserId } from '../value-objects/user-id.value-object';

describe('UserId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should create a UserId with a valid UUID', () => {
    const id = new UserId(validUuid);
    expect(id.toValue()).toBe(validUuid);
  });

  it('should throw for invalid UUID format', () => {
    expect(() => new UserId('not-a-uuid')).toThrow('El formato del UUID no es válido');
  });

  it('should be equal to another UserId with the same UUID', () => {
    const id1 = new UserId(validUuid);
    const id2 = new UserId(validUuid);
    expect(id1.equals(id2)).toBe(true);
  });

  it('should NOT be equal to another UserId with a different UUID', () => {
    const id1 = new UserId(validUuid);
    const id2 = new UserId('660e8400-e29b-41d4-a716-446655440000');
    expect(id1.equals(id2)).toBe(false);
  });

  describe('UserId.generate()', () => {
    it('should return a valid UserId instance', () => {
      const id = UserId.generate();
      expect(id).toBeInstanceOf(UserId);
    });

    it('should return a value that matches UUID v4 format', () => {
      const id = UserId.generate();
      const value = id.toValue();
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(value).toMatch(uuidV4Regex);
    });

    it('should produce a different UUID on each call', () => {
      const id1 = UserId.generate();
      const id2 = UserId.generate();
      expect(id1.toValue()).not.toBe(id2.toValue());
    });

    it('should produce a value accepted by the constructor', () => {
      const id = UserId.generate();
      expect(() => new UserId(id.toValue())).not.toThrow();
    });
  });
});
