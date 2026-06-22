import type { CallHandler, ExecutionContext } from '@nestjs/common';

import { of } from 'rxjs';

import { ResponseEnvelopeInterceptor } from '../interceptors/response-envelope.interceptor';

describe('ResponseEnvelopeInterceptor', () => {
  let interceptor: ResponseEnvelopeInterceptor;

  beforeEach(() => {
    interceptor = new ResponseEnvelopeInterceptor();
  });

  const mockContext = {} as ExecutionContext;

  const createMockHandler = (data: unknown): CallHandler => ({
    handle: () => of(data),
  });

  it('should wrap a simple object response', (done) => {
    const handler = createMockHandler({ id: 1, name: 'Test' });
    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'Test' },
      });
      done();
    });
  });

  it('should wrap null response', (done) => {
    const handler = createMockHandler(null);
    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
      });
      done();
    });
  });

  it('should wrap array response', (done) => {
    const handler = createMockHandler([1, 2, 3]);
    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: [1, 2, 3],
      });
      done();
    });
  });

  it('should include meta when response has pagination', (done) => {
    const paginatedData = {
      data: [{ id: 1 }],
      meta: { page: 1, limit: 10, total: 50, totalPages: 5 },
    };
    const handler = createMockHandler(paginatedData);
    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: [{ id: 1 }],
        meta: { page: 1, limit: 10, total: 50, totalPages: 5 },
      });
      done();
    });
  });
});
