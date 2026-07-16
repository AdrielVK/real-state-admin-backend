import type { ICommand } from '@shared/domain';

import type { User } from '../../../identity/domain';
import type { CreateBusinessUserDto } from '../dto/create-business-user.dto';

export class CreateBusinessUserCommand implements ICommand<User> {
  readonly _resultType?: User;

  constructor(readonly dto: CreateBusinessUserDto) {}
}
