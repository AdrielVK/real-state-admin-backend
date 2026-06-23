import { AggregateRoot } from '@shared/domain';

import { ProfileId } from '../value-objects/profile-id.value-object';

export abstract class Profile<TId extends ProfileId> extends AggregateRoot<TId> {
  protected readonly _userId: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  protected constructor(userId: string) {
    const id = ProfileId.generate() as TId;
    super(id);
    this._userId = userId;
    const now = new Date();
    this._createdAt = now;
    this._updatedAt = now;
  }

  get userId(): string {
    return this._userId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  touch(): void {
    this._updatedAt = new Date();
  }

  toPrimitives(): Record<string, unknown> {
    return {
      id: this.id.toValue(),
      userId: this._userId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
