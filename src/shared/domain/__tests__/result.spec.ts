import { Result } from '../result';

describe('Result', () => {
  describe('ok (success)', () => {
    it('should create a successful result', () => {
      const result = Result.ok('hello');
      expect(result.isOk).toBe(true);
      expect(result.isFail).toBe(false);
    });

    it('should return the value via getValue()', () => {
      const result = Result.ok(42);
      expect(result.getValue()).toBe(42);
    });

    it('should throw when getError() is called on success', () => {
      const result = Result.ok('value');
      expect(() => result.getError()).toThrow('Cannot get error from a success result');
    });

    it('should map the value', () => {
      const result = Result.ok(5);
      const mapped = result.map((x) => x * 2);
      expect(mapped.isOk).toBe(true);
      expect(mapped.getValue()).toBe(10);
    });

    it('should flatMap the value', () => {
      const result = Result.ok(5);
      const mapped = result.flatMap((x) => Result.ok(x * 3));
      expect(mapped.isOk).toBe(true);
      expect(mapped.getValue()).toBe(15);
    });

    it('should flatMap to a failure', () => {
      const result = Result.ok(5);
      const mapped = result.flatMap(() => Result.fail<string>('oops'));
      expect(mapped.isFail).toBe(true);
      expect(mapped.getError()).toBe('oops');
    });
  });

  describe('fail (failure)', () => {
    it('should create a failed result', () => {
      const result = Result.fail<string>('error');
      expect(result.isOk).toBe(false);
      expect(result.isFail).toBe(true);
    });

    it('should return the error via getError()', () => {
      const result = Result.fail<string>('something went wrong');
      expect(result.getError()).toBe('something went wrong');
    });

    it('should throw when getValue() is called on failure', () => {
      const result = Result.fail<string>('error');
      expect(() => result.getValue()).toThrow('Cannot get value from a failed result');
    });

    it('should NOT map on failure', () => {
      const result = Result.fail<number>('error');
      const mapped = result.map((x) => x * 2);
      expect(mapped.isFail).toBe(true);
      expect(mapped.getError()).toBe('error');
    });

    it('should NOT flatMap on failure', () => {
      const result = Result.fail<number>('error');
      const mapped = result.flatMap(() => Result.ok(99));
      expect(mapped.isFail).toBe(true);
      expect(mapped.getError()).toBe('error');
    });
  });
});
