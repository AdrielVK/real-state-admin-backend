export class Result<T, E = string> {
  private readonly _value?: T;
  private readonly _error?: E;
  private readonly _isOk: boolean;

  private constructor(value: T | undefined, error: E | undefined, isOk: boolean) {
    this._value = value;
    this._error = error;
    this._isOk = isOk;
  }

  static ok<T, E = string>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined, true);
  }

  static fail<T, E = string>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error, false);
  }

  get isOk(): boolean {
    return this._isOk;
  }

  get isFail(): boolean {
    return !this._isOk;
  }

  getValue(): T {
    if (!this._isOk) {
      throw new Error('Cannot get value from a failed result');
    }
    return this._value as T;
  }

  getError(): E {
    if (this._isOk) {
      throw new Error('Cannot get error from a success result');
    }
    return this._error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isOk) {
      return Result.ok<U, E>(fn(this._value as T));
    }
    return Result.fail<U, E>(this._error as E);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isOk) {
      return fn(this._value as T);
    }
    return Result.fail<U, E>(this._error as E);
  }
}
