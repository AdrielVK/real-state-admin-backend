/**
 * Jest global type declarations.
 *
 * @types/jest lacks an 'exports' field, making it incompatible with
 * TypeScript's nodenext moduleResolution. This file provides minimal
 * ambient declarations so that test files don't show false errors.
 *
 * Actual type checking for tests is handled by ts-jest at test time.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare function describe(name: string, fn: () => void | Promise<void>): void;
declare function describe(name: string, options: any, fn: () => void | Promise<void>): void;

declare function it(name: string, fn: () => void | Promise<void>): void;

declare function test(name: string, fn: () => void | Promise<void>): void;

declare function beforeAll(fn: () => void | Promise<void>, timeout?: number): void;
declare function afterAll(fn: () => void | Promise<void>, timeout?: number): void;
declare function beforeEach(fn: () => void | Promise<void>, timeout?: number): void;
declare function afterEach(fn: () => void | Promise<void>, timeout?: number): void;

declare function expect(actual: any): any;

// eslint-disable-next-line no-var
declare var jest: {
  fn<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown>(
    implementation?: T,
  ): jest.Mock<ReturnType<T>, Parameters<T>>;
  spyOn<T extends object, K extends keyof T>(
    object: T,
    method: K,
  ): jest.SpyInstance<ReturnType<T[K] extends (...args: unknown[]) => unknown ? T[K] : never>>;
};

declare namespace jest {
  interface Mock<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> {
    (...args: Parameters<T>): ReturnType<T>;
    mock: { calls: unknown[][]; results: unknown[] };
    mockImplementation(fn: T): jest.Mock<T>;
    mockResolvedValue(value: unknown): jest.Mock<T>;
    mockRejectedValue(error: unknown): jest.Mock<T>;
    mockReturnValue(value: unknown): jest.Mock<T>;
    mockReset(): void;
    mockClear(): void;
  }

  type Mocked<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? jest.Mock<T[K]> : T[K];
  } & T;

  type MockedFunction<T extends (...args: unknown[]) => unknown> = jest.Mock<T>;

  type SpyInstance<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> =
    jest.Mock<T>;
}
declare let xit: (name: string, fn: () => void | Promise<void>) => void;
declare let fit: (name: string, fn: () => void | Promise<void>) => void;
declare let xtest: (name: string, fn: () => void | Promise<void>) => void;
