import { Entity } from '@shared/domain';

import type { UserRole } from '../enums/user-role.enum';
import type { UserEmail } from '../value-objects/user-email.value-object';
import type { UserId } from '../value-objects/user-id.value-object';

interface UserProps {
  email: UserEmail;
  firstName: string;
  lastName: string;
  role: UserRole;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Entity<UserId> {
  private readonly _email: UserEmail;
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _role: UserRole;
  private readonly _passwordHash: string;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  private constructor(id: UserId, props: UserProps) {
    super(id);
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._role = props.role;
    this._passwordHash = props.passwordHash;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: { id: UserId } & UserProps): User {
    return new User(props.id, props);
  }

  get email(): UserEmail {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get role(): UserRole {
    return this._role;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  toPrimitives(): Record<string, unknown> {
    return {
      id: this.id.toValue(),
      email: this._email.value,
      firstName: this._firstName,
      lastName: this._lastName,
      role: this._role,
      passwordHash: this._passwordHash,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
