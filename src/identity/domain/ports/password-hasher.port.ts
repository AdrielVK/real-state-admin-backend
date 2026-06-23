import type { PlainPassword } from '../value-objects/plain-password.value-object';

export interface IPasswordHasher {
  hash(plainPassword: PlainPassword): Promise<string>;
  compare(plainPassword: PlainPassword, hash: string): Promise<boolean>;
}

export const IPasswordHasher = Symbol('IPasswordHasher');
