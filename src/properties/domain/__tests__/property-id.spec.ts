import { PropertyId } from '../value-objects/property-id.value-object';

describe('PropertyId', () => {
  it('should accept a valid UUID', () => {
    const id = new PropertyId('550e8400-e29b-41d4-a716-446655440000');
    expect(id.toValue()).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should reject a non-UUID string', () => {
    expect(() => new PropertyId('not-a-uuid')).toThrow();
  });

  it('should generate a fresh UUID v4', () => {
    const id = PropertyId.generate();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id.toValue()).toMatch(uuidV4Regex);
  });

  it('should generate a different value on each call', () => {
    const a = PropertyId.generate();
    const b = PropertyId.generate();
    expect(a.toValue()).not.toBe(b.toValue());
  });

  it('should be equal to another PropertyId with the same UUID', () => {
    const a = new PropertyId('550e8400-e29b-41d4-a716-446655440000');
    const b = new PropertyId('550e8400-e29b-41d4-a716-446655440000');
    expect(a.equals(b)).toBe(true);
  });
});
