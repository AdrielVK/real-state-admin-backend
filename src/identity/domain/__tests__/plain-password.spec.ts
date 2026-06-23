import { DomainException, ErrorCode } from '@shared/domain';

import { PlainPassword } from '../value-objects/plain-password.value-object';

describe('PlainPassword', () => {
  const VALID_PASSWORD = 'Secure1!';

  it('should create a PlainPassword with a valid password', () => {
    const password = PlainPassword.create(VALID_PASSWORD);
    expect(password.value).toBe(VALID_PASSWORD);
  });

  it('should throw DomainException with VALIDATION_ERROR for password shorter than 8 chars', () => {
    expect(() => PlainPassword.create('Short1!')).toThrow(DomainException);
    try {
      PlainPassword.create('Short1!');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainException);
      expect((error as DomainException).code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should throw DomainException when missing uppercase letter', () => {
    expect(() => PlainPassword.create('secure1!')).toThrow(DomainException);
  });

  it('should throw DomainException when missing lowercase letter', () => {
    expect(() => PlainPassword.create('SECURE1!')).toThrow(DomainException);
  });

  it('should throw DomainException when missing a non-alphanumeric symbol', () => {
    expect(() => PlainPassword.create('Secure123')).toThrow(DomainException);
  });

  it('should throw DomainException for empty string', () => {
    expect(() => PlainPassword.create('')).toThrow(DomainException);
  });

  it('should accept passwords with various non-alphanumeric symbols', () => {
    expect(() => PlainPassword.create('Password@1')).not.toThrow();
    expect(() => PlainPassword.create('Password#1')).not.toThrow();
    expect(() => PlainPassword.create('Password$1')).not.toThrow();
    expect(() => PlainPassword.create('Password%1')).not.toThrow();
    expect(() => PlainPassword.create('Password&1')).not.toThrow();
    expect(() => PlainPassword.create('Password*1')).not.toThrow();
  });

  it('should accept a long valid password', () => {
    const long = 'Abcdef1!AndThenSomeMore';
    expect(() => PlainPassword.create(long)).not.toThrow();
  });

  it('should be immutable (no setters)', () => {
    const password = PlainPassword.create(VALID_PASSWORD);
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(password), 'value') as
      | PropertyDescriptor
      | undefined;
    // We only reference `.set` to assert it is undefined; we never invoke it.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(descriptor?.set).toBeUndefined();
  });

  it('should be equal to another PlainPassword with the same value', () => {
    const a = PlainPassword.create(VALID_PASSWORD);
    const b = PlainPassword.create(VALID_PASSWORD);
    expect(a.equals(b)).toBe(true);
  });

  it('should NOT be equal to another PlainPassword with a different value', () => {
    const a = PlainPassword.create(VALID_PASSWORD);
    const b = PlainPassword.create('OtherPass1!');
    expect(a.equals(b)).toBe(false);
  });
});
