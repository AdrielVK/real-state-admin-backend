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

  static reconstitute(
    profileId: string,
    userId: string,
    createdAt: Date,
    updatedAt: Date,
  ): Profile<ProfileId> {
    // Object.create bypasses the constructor so the ID and timestamps can be
    // supplied from persistence. The `as` cast widens the readonly fields just
    // for this initialization step — they remain readonly after this point.
    const profile = Object.create(this.prototype) as Profile<ProfileId> & {
      _id: ProfileId;
      _userId: string;
      _createdAt: Date;
      _updatedAt: Date;
      _domainEvents: never[];
    };
    profile._id = new ProfileId(profileId);
    profile._userId = userId;
    profile._createdAt = createdAt;
    profile._updatedAt = updatedAt;
    profile._domainEvents = [];
    return profile;
  }
}
