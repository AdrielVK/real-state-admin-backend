import { HttpException, HttpStatus } from '@nestjs/common';

import { ErrorCode } from '@shared/domain';

import type { ErrorDetail } from '../types/api-response.type';

const ERROR_CODE_STATUS_MAP: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorCode.INTERNAL_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
};

export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: ErrorDetail[], statusCode?: HttpStatus) {
    const status = statusCode ?? ERROR_CODE_STATUS_MAP[code];
    super(message, status);
    this.code = code;
    this.details = details;
  }
}
