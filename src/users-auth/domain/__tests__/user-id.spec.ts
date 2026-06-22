import { UserId } from '../value-objects/user-id.value-object';

describe('UserId', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should create a UserId with a valid UUID', () => {
    const id = new UserId(validUuid);
    expect(id.toValue()).toBe(validUuid);
  });

  it('should throw for invalid UUID format', () => {
    expect(() => new UserId('not-a-uuid')).toThrow('Invalid UUID format');
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
});
