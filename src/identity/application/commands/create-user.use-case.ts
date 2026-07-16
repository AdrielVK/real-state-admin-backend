import { Inject, Injectable } from '@nestjs/common';

import {
  ErrorCode,
  type ICommand,
  type ICommandHandler,
  type IDomainEventPublisher,
} from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IPasswordHasher,
  IPasswordHasherToken,
  type IUserRepository,
  IUserRepositoryToken,
  User,
  UserEmail,
} from '../../domain';
import { PlainPassword } from '../../domain/value-objects/plain-password.value-object';

export class CreateUserCommand implements ICommand<User> {
  readonly _resultType?: User;

  constructor(
    readonly email: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly password: string,
  ) {}
}

@Injectable()
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand, User> {
  constructor(
    @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository,
    @Inject(IPasswordHasherToken) private readonly passwordHasher: IPasswordHasher,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const email = new UserEmail(command.email);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppException(ErrorCode.CONFLICT, 'El email ya está registrado');
    }

    const plainPassword = PlainPassword.create(command.password);

    const user = await User.register(
      email,
      plainPassword,
      command.firstName,
      command.lastName,
      this.passwordHasher,
    );

    const savedUser = await this.userRepository.save(user);

    const events = savedUser.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return savedUser;
  }
}
