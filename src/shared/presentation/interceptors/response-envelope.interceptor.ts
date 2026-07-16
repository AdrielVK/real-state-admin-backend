import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';

import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedResponse {
  data: unknown[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function isPaginatedResponse(data: unknown): data is PaginatedResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    'meta' in data &&
    Array.isArray((data as PaginatedResponse).data)
  );
}

function hasMessageField(data: unknown): data is { message: string; data: unknown } {
  return typeof data === 'object' && data !== null && 'message' in data && 'data' in data;
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor<unknown, unknown> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (isPaginatedResponse(data)) {
          return {
            success: true as const,
            data: data.data,
            meta: data.meta,
          };
        }
        if (hasMessageField(data)) {
          return {
            success: true as const,
            message: data.message,
            data: data.data,
          };
        }
        return {
          success: true as const,
          data,
        };
      }),
    );
  }
}
