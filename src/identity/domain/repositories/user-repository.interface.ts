import type { User } from '../entities/user.entity';
import type { UserEmail } from '../value-objects/user-email.value-object';
import type { UserId } from '../value-objects/user-id.value-object';

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: UserEmail): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: UserId): Promise<void>;
}

export const IUserRepository = Symbol('IUserRepository');
