import { Injectable } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import type { IPasswordHasher } from '../../domain/ports/password-hasher.port';
import type { PlainPassword } from '../../domain/value-objects/plain-password.value-object';

const SALT_ROUNDS = 10;

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plainPassword: PlainPassword): Promise<string> {
    return bcrypt.hash(plainPassword.value, SALT_ROUNDS);
  }

  async compare(plainPassword: PlainPassword, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword.value, hash);
  }
}
