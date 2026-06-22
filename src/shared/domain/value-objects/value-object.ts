export type ValueObjectProps = Record<string, unknown>;

export abstract class ValueObject<T extends ValueObjectProps> {
  private readonly _props: T;

  protected constructor(props: T) {
    this._props = Object.freeze({ ...props });
  }

  get props(): T {
    return this._props;
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    const keysA = Object.keys(this._props) as Array<keyof T>;
    const keysB = Object.keys(other._props) as Array<keyof T>;
    if (keysA.length !== keysB.length) {
      return false;
    }
    return keysA.every((key) => this._props[key] === other._props[key]);
  }
}
