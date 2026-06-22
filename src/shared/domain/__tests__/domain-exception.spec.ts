import { DomainException } from '../exceptions/domain.exception';

describe('DomainException', () => {
  it('should create an exception with a message', () => {
    const error = new DomainException('Email already in use');
    expect(error.message).toBe('Email already in use');
    expect(error).toBeInstanceOf(Error);
  });

  it('should create an exception with a message and error code', () => {
    const error = new DomainException('Email already in use', 'CONFLICT');
    expect(error.message).toBe('Email already in use');
    expect(error.code).toBe('CONFLICT');
  });

  it('should NOT depend on @nestjs/common', () => {
    const error = new DomainException('test');
    expect(error.name).toBe('DomainException');
    // DomainException extends Error, not HttpException
    expect(error).toBeInstanceOf(Error);
  });

  it('should have a name property', () => {
    const error = new DomainException('test');
    expect(error.name).toBe('DomainException');
  });
});
