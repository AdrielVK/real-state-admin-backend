import { Inject, Injectable } from '@nestjs/common';

import {
  ErrorCode,
  type ICommandHandler,
  type IDomainEventPublisher,
  UserRole,
} from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IPasswordHasher,
  IPasswordHasherToken,
  type IUserRepository,
  IUserRepositoryToken,
  PlainPassword,
  User,
  UserEmail,
} from '../../../identity/domain';
import { CreateBusinessUserCommand } from './create-business-user.command';

@Injectable()
export class CreateBusinessUserUseCase implements ICommandHandler<CreateBusinessUserCommand, User> {
  constructor(
    @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository,
    @Inject(IPasswordHasherToken) private readonly passwordHasher: IPasswordHasher,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  private checkRoleEnablementOfNewBusinessUser(role: UserRole): void {
    if (role != UserRole.ADMIN) return;
    throw new AppException(ErrorCode.INVALID_ROLE, 'No se puede crear otro usuario administrador');
  }

  async execute(command: CreateBusinessUserCommand): Promise<User> {
    const { dto } = command;

    this.checkRoleEnablementOfNewBusinessUser(dto.role);

    const email = new UserEmail(dto.email);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppException(ErrorCode.CONFLICT, 'El email ya está registrado');
    }

    const plainPassword = PlainPassword.create(dto.password);

    const user = await User.createBusinessUser(
      email,
      plainPassword,
      dto.firstName,
      dto.lastName,
      dto.role,
      this.passwordHasher,
    );

    const savedUser = await this.userRepository.save(user);

    const events = savedUser.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return savedUser;
  }
}
