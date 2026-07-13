import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

function makeExecutionContext(): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as unknown as ExecutionContext;
}

function swapParentCanActivate(replacement: () => unknown): () => void {
  const superProto = Object.getPrototypeOf(JwtAuthGuard.prototype) as Record<string, unknown>;
  const original = superProto.canActivate;
  superProto.canActivate = replacement;
  return () => {
    superProto.canActivate = original;
  };
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);
  });

  describe('@Public() route', () => {
    it('should return true and skip the underlying JWT auth when @Public() metadata is present', () => {
      const context = makeExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(true);
      const superMock = jest.fn().mockReturnValue(true);
      const restore = swapParentCanActivate(superMock);

      try {
        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
        expect(superMock).not.toHaveBeenCalled();
      } finally {
        restore();
      }
    });
  });

  describe('protected route', () => {
    it('should query metadata for both the handler and the class', () => {
      const context = makeExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);
      const superMock = jest.fn().mockReturnValue(true);
      const restore = swapParentCanActivate(superMock);

      try {
        const result = guard.canActivate(context);

        expect(result).toBe(true);
        const [key, targets] = reflector.getAllAndOverride.mock.calls[0] ?? [];
        expect(key).toBe(IS_PUBLIC_KEY);
        expect(targets).toEqual([context.getHandler(), context.getClass()]);
      } finally {
        restore();
      }
    });

    it('should delegate to the underlying AuthGuard("jwt") when @Public() metadata is absent', () => {
      const context = makeExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);
      const superMock = jest.fn().mockReturnValue(true);
      const restore = swapParentCanActivate(superMock);

      try {
        const result = guard.canActivate(context);

        expect(superMock).toHaveBeenCalledWith(context);
        expect(result).toBe(true);
      } finally {
        restore();
      }
    });

    it('should propagate UnauthorizedException from the underlying AuthGuard("jwt")', () => {
      const context = makeExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(false);
      const superMock = jest.fn().mockImplementation(() => {
        throw new UnauthorizedException();
      });
      const restore = swapParentCanActivate(superMock);

      try {
        const invokeGuard = (): unknown => guard.canActivate(context);
        expect(invokeGuard).toThrow(UnauthorizedException);
      } finally {
        restore();
      }
    });
  });
});
