export abstract class Identifier<T> {
  private readonly _value: T;

  protected constructor(value: T) {
    this._value = value;
  }

  toValue(): T {
    return this._value;
  }

  toString(): string {
    return String(this._value);
  }

  equals(other: Identifier<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this._value === other._value;
  }
}
