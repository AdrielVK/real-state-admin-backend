import { randomUUID } from 'node:crypto';

import { Identifier } from '@shared/domain';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PropertyId extends Identifier<string> {
  constructor(value: string) {
    if (!UUID_REGEX.test(value)) {
      throw new Error('El formato del UUID no es válido');
    }
    super(value);
  }

  static generate(): PropertyId {
    return new PropertyId(randomUUID());
  }
}
