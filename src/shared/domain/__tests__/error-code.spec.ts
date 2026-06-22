import { ErrorCode } from '../exceptions/error-code.enum';

describe('ErrorCode', () => {
  it('should contain VALIDATION_ERROR', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
  });

  it('should contain NOT_FOUND', () => {
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
  });

  it('should contain UNAUTHORIZED', () => {
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
  });

  it('should contain FORBIDDEN', () => {
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
  });

  it('should contain CONFLICT', () => {
    expect(ErrorCode.CONFLICT).toBe('CONFLICT');
  });

  it('should contain INTERNAL_ERROR', () => {
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });

  it('should contain BAD_REQUEST', () => {
    expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
  });
});
