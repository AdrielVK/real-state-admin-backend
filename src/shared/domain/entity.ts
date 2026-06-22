import type { Identifier } from './value-objects/identifier';

export abstract class Entity<T extends Identifier<unknown>> {
  private readonly _id: T;

  protected constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  abstract toPrimitives(): Record<string, unknown>;

  equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this._id.equals(other._id);
  }
}
