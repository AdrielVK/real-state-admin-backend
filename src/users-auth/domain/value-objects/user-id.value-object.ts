import { Identifier } from '@shared/domain';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class UserId extends Identifier<string> {
  constructor(value: string) {
    if (!UUID_REGEX.test(value)) {
      throw new Error('Invalid UUID format');
    }
    super(value);
  }
}
