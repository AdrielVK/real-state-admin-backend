import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';

import type { Response } from 'express';

import { DomainException, ErrorCode } from '@shared/domain';

import { AppException } from '../exceptions/app.exception';

const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.details && { details: exception.details }),
        },
      });
      return;
    }

    if (exception instanceof DomainException) {
      // Propagate the DomainException code when present; otherwise default to
      // BAD_REQUEST. The HTTP status is BAD_REQUEST for any domain exception
      // because they represent invalid inputs/business rule violations.
      const code =
        (exception.code as ErrorCode | undefined) &&
        Object.values(ErrorCode).includes(exception.code as ErrorCode)
          ? (exception.code as ErrorCode)
          : ErrorCode.BAD_REQUEST;
      response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: {
          code,
          message: exception.message,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = HTTP_STATUS_TO_ERROR_CODE[status] ?? ErrorCode.BAD_REQUEST;
      response.status(status).json({
        success: false,
        error: {
          code,
          message: exception.message,
        },
      });
      return;
    }

    // Unknown error
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : undefined,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      },
    });
  }
}
