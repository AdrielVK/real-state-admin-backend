import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from '@shared/domain';

import { AppException } from '../exceptions/app.exception';

describe('AppException', () => {
  it('should create an exception with code and message', () => {
    const error = new AppException(ErrorCode.NOT_FOUND, 'User not found');
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('User not found');
  });

  it('should default to BAD_REQUEST status for unknown codes', () => {
    const error = new AppException(ErrorCode.VALIDATION_ERROR, 'Invalid input');
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should map NOT_FOUND to 404', () => {
    const error = new AppException(ErrorCode.NOT_FOUND, 'Not found');
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('should map UNAUTHORIZED to 401', () => {
    const error = new AppException(ErrorCode.UNAUTHORIZED, 'Unauthorized');
    expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should map FORBIDDEN to 403', () => {
    const error = new AppException(ErrorCode.FORBIDDEN, 'Forbidden');
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
  });

  it('should map CONFLICT to 409', () => {
    const error = new AppException(ErrorCode.CONFLICT, 'Conflict');
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('should map INTERNAL_ERROR to 500', () => {
    const error = new AppException(ErrorCode.INTERNAL_ERROR, 'Internal error');
    expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should accept custom status code', () => {
    const error = new AppException(
      ErrorCode.BAD_REQUEST,
      'Bad request',
      undefined,
      HttpStatus.I_AM_A_TEAPOT,
    );
    expect(error.getStatus()).toBe(HttpStatus.I_AM_A_TEAPOT);
  });

  it('should accept details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const error = new AppException(ErrorCode.VALIDATION_ERROR, 'Validation failed', details);
    expect(error.details).toEqual(details);
  });
});
