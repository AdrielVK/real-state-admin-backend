import { UserEmail } from '../value-objects/user-email.value-object';

describe('UserEmail', () => {
  it('should create a UserEmail with a valid email', () => {
    const email = new UserEmail('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('should throw for invalid email format', () => {
    expect(() => new UserEmail('not-an-email')).toThrow('Invalid email format');
  });

  it('should throw for empty string', () => {
    expect(() => new UserEmail('')).toThrow('Invalid email format');
  });

  it('should be equal to another UserEmail with the same value', () => {
    const email1 = new UserEmail('test@example.com');
    const email2 = new UserEmail('test@example.com');
    expect(email1.equals(email2)).toBe(true);
  });

  it('should NOT be equal to another UserEmail with a different value', () => {
    const email1 = new UserEmail('test@example.com');
    const email2 = new UserEmail('other@example.com');
    expect(email1.equals(email2)).toBe(false);
  });
});
