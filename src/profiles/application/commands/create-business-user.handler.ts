import { Inject, Injectable } from '@nestjs/common';

import { ErrorCode, type IDomainEventPublisher, UserRole } from '@shared/domain';
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
import { AdminProfile } from '../../domain';
import { CreateBusinessUserDto } from '../dto/create-business-user.dto';

@Injectable()
export class CreateBusinessUserHandler {
  constructor(
    @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository,
    @Inject(IPasswordHasherToken) private readonly passwordHasher: IPasswordHasher,
    @Inject('IDomainEventPublisher') private readonly eventPublisher: IDomainEventPublisher,
  ) {}

  async execute(dto: CreateBusinessUserDto): Promise<User> {
    const authorization = AdminProfile.canCreateBusinessUser(UserRole.ADMIN, dto.role);
    if (authorization.isFail) {
      const error = authorization.getError();
      throw new AppException(
        (error.code as ErrorCode | undefined) ?? ErrorCode.FORBIDDEN,
        error.message,
        undefined,
        undefined,
      );
    }

    const email = new UserEmail(dto.email);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppException(ErrorCode.CONFLICT, 'El email ya está registrado');
    }

    const plainPassword = PlainPassword.create(dto.password);

    const user = await User.register(
      email,
      plainPassword,
      dto.firstName,
      dto.lastName,
      this.passwordHasher,
      dto.role,
    );

    const savedUser = await this.userRepository.save(user);

    const events = savedUser.pullDomainEvents();
    await Promise.all(events.map(async (event) => this.eventPublisher.publish(event)));

    return savedUser;
  }
}
