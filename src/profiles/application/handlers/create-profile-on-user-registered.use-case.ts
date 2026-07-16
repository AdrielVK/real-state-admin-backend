import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { UserRole } from '@shared/domain';

import { type IProfileRepository, IProfileRepositoryToken } from '../../domain';
import { createProfileForRole } from '../factories/role-to-profile.factory';

interface UserRegisteredPayload {
  userId: string;
  role: string;
}

@Injectable()
export class CreateProfileOnUserRegisteredUseCase {
  private readonly logger = new Logger(CreateProfileOnUserRegisteredUseCase.name);

  constructor(
    @Inject(IProfileRepositoryToken) private readonly profileRepository: IProfileRepository,
  ) {}

  @OnEvent('identity.user.registered')
  async handle(payload: UserRegisteredPayload): Promise<void> {
    try {
      const existing = await this.profileRepository.findByUserId(payload.userId);
      if (existing) {
        return;
      }

      const role = payload.role as UserRole;
      const profile = createProfileForRole(role, payload.userId);
      await this.profileRepository.save(profile);
    } catch (error) {
      this.logger.error(
        `Failed to create profile for user ${payload.userId} with role ${payload.role}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
