import { Inject, Injectable } from '@nestjs/common';

import { ErrorCode } from '@shared/domain';
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
import { type IProfileRepository, IProfileRepositoryToken } from '../../domain';
import type { CreateBusinessUserDto } from '../dto/create-business-user.dto';
import { createProfileForRole } from '../handlers/role-to-profile.factory';

@Injectable()
export class CreateBusinessUserHandler {
  constructor(
    @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository,
    @Inject(IPasswordHasherToken) private readonly passwordHasher: IPasswordHasher,
    @Inject(IProfileRepositoryToken) private readonly profileRepository: IProfileRepository,
  ) {}

  async execute(dto: CreateBusinessUserDto): Promise<User> {
    // 1. Validate email format
    const email = new UserEmail(dto.email);

    // 2. Check email uniqueness
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppException(ErrorCode.CONFLICT, 'El email ya está registrado');
    }

    // 3. Validate password complexity (PlainPassword enforces invariants)
    const plainPassword = PlainPassword.create(dto.password);

    // 4. Create user with domain factory — sets PENDING_PASSWORD_CHANGE
    const user = await User.createBusinessUser(
      email,
      plainPassword,
      dto.firstName,
      dto.lastName,
      dto.role,
      this.passwordHasher,
    );

    // 5. Persist user
    const savedUser = await this.userRepository.save(user);

    // 6. Directly create profile (no event consistency issues)
    const profile = createProfileForRole(dto.role, savedUser.id.toValue());
    await this.profileRepository.save(profile);

    return savedUser;
  }
}
