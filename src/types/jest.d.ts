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
declare var jest: any;
declare let xit: (name: string, fn: () => void | Promise<void>) => void;
declare let fit: (name: string, fn: () => void | Promise<void>) => void;
declare let xtest: (name: string, fn: () => void | Promise<void>) => void;
