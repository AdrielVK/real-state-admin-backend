import { AggregateRoot, UserRole } from '@shared/domain';

import { UserStatus } from '../enums/user-status.enum';
import { UserPasswordChangedEvent } from '../events/user-password-changed.event';
import { UserRegisteredEvent } from '../events/user-registered.event';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import type { PlainPassword } from '../value-objects/plain-password.value-object';
import type { UserEmail } from '../value-objects/user-email.value-object';
import { UserId } from '../value-objects/user-id.value-object';

interface UserProps {
  email: UserEmail;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserId> {
  private readonly _email: UserEmail;
  private readonly _firstName: string;
  private readonly _lastName: string;
  private readonly _role: UserRole;
  private _status: UserStatus;
  private _passwordHash: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: UserId, props: UserProps) {
    super(id);
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._role = props.role;
    this._status = props.status;
    this._passwordHash = props.passwordHash;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static async register(
    email: UserEmail,
    plainPassword: PlainPassword,
    firstName: string,
    lastName: string,
    passwordHasher: IPasswordHasher,
  ): Promise<User> {
    const id = UserId.generate();
    const passwordHash = await passwordHasher.hash(plainPassword);
    const now = new Date();

    const user = new User(id, {
      email,
      firstName,
      lastName,
      role: UserRole.VISITOR,
      status: UserStatus.ACTIVE,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(new UserRegisteredEvent(id.toValue(), email.value, UserRole.VISITOR));

    return user;
  }

  static async createBusinessUser(
    email: UserEmail,
    plainPassword: PlainPassword,
    firstName: string,
    lastName: string,
    role: UserRole,
    passwordHasher: IPasswordHasher,
  ): Promise<User> {
    const id = UserId.generate();
    const passwordHash = await passwordHasher.hash(plainPassword);
    const now = new Date();

    const user = new User(id, {
      email,
      firstName,
      lastName,
      role,
      status: UserStatus.PENDING_PASSWORD_CHANGE,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(new UserRegisteredEvent(id.toValue(), email.value, role));

    return user;
  }

  static reconstitute(
    id: UserId,
    email: UserEmail,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    status: UserStatus,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, {
      email,
      firstName,
      lastName,
      role,
      status,
      passwordHash,
      createdAt,
      updatedAt,
    });
  }

  async changePassword(
    plainPassword: PlainPassword,
    passwordHasher: IPasswordHasher,
  ): Promise<void> {
    this._passwordHash = await passwordHasher.hash(plainPassword);
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
    this.addDomainEvent(new UserPasswordChangedEvent(this.id.toValue()));
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

  get status(): UserStatus {
    return this._status;
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
      status: this._status,
      passwordHash: this._passwordHash,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
