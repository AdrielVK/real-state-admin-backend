import { randomBytes } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import type { IPropertyInternalIdGenerator } from '../../domain/ports/internal-id-generator.interface';

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LENGTH = 7;

@Injectable()
export class RandomPropertyInternalIdGenerator implements IPropertyInternalIdGenerator {
  private readonly logger = new Logger(RandomPropertyInternalIdGenerator.name);

  generate(): string {
    const bytes = randomBytes(LENGTH);
    let result = '';
    for (let i = 0; i < LENGTH; i++) {
      const byte: number = bytes[i] ?? 0;
      const index = byte % ALPHANUMERIC.length;
      const char = ALPHANUMERIC[index] ?? 'A';
      result += char;
    }
    this.logger.debug(`Generated internal id: ${result}`);
    return result;
  }
}
