import { type ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

import { DomainException, ErrorCode } from '@shared/domain';

import { AppException } from '../exceptions/app.exception';
import { GlobalExceptionFilter } from '../filters/http-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle AppException with correct code and status', () => {
    const exception = new AppException(ErrorCode.NOT_FOUND, 'User not found');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'User not found',
      },
    });
  });

  it('should handle AppException with details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const exception = new AppException(ErrorCode.VALIDATION_ERROR, 'Validation failed', details);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  });

  it('should handle DomainException as BAD_REQUEST', () => {
    const exception = new DomainException('Domain rule violated');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.BAD_REQUEST,
        message: 'Domain rule violated',
      },
    });
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.BAD_REQUEST,
        message: 'Forbidden',
      },
    });
  });

  it('should handle unknown Error as 500 INTERNAL_ERROR', () => {
    const exception = new Error('Something broke');
    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      },
    });
  });

  it('should NOT leak stack traces to the client', () => {
    const exception = new Error('Secret error details');
    filter.catch(exception, mockHost);

    const responseBody = mockResponse.json.mock.calls[0][0];
    expect(responseBody.error).not.toHaveProperty('stack');
    expect(responseBody.error).not.toHaveProperty('trace');
  });
});
