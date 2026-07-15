import { randomUUID } from 'node:crypto';

import { DomainException, ErrorCode, Identifier } from '@shared/domain';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PropertyId extends Identifier<string> {
  constructor(value: string) {
    if (!UUID_REGEX.test(value)) {
      throw new DomainException('El formato del UUID no es válido', ErrorCode.VALIDATION_ERROR);
    }
    super(value);
  }

  static generate(): PropertyId {
    return new PropertyId(randomUUID());
  }
}
