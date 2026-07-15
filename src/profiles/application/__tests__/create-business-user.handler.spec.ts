import 'reflect-metadata';

import { ErrorCode, UserRole } from '@shared/domain';
import { AppException } from '@shared/presentation';

import type {
  IPasswordHasher,
  IUserRepository,
  User,
  UserEmail,
  UserId,
} from '../../../identity/domain';
import type { ProfileId } from '../../domain';
import type { Profile } from '../../domain';
import type { IProfileRepository } from '../../domain';
import { CreateBusinessUserHandler } from '../commands/create-business-user.handler';
import { CreateBusinessUserDto } from '../dto/create-business-user.dto';

function makeMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (user: User) => user),
    delete: jest.fn(),
  } as jest.Mocked<IUserRepository>;
}

function makeMockPasswordHasher(): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn(),
  } as jest.Mocked<IPasswordHasher>;
}

function makeMockProfileRepository(): jest.Mocked<IProfileRepository> {
  return {
    findByUserId: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (profile: Profile<ProfileId>) => profile),
  } as jest.Mocked<IProfileRepository>;
}

function makeHandler() {
  const userRepository = makeMockUserRepository();
  const passwordHasher = makeMockPasswordHasher();
  const profileRepository = makeMockProfileRepository();
  const handler = new CreateBusinessUserHandler(userRepository, passwordHasher, profileRepository);
  return { handler, userRepository, passwordHasher, profileRepository };
}

const validDto = (role: UserRole = UserRole.AGENT): CreateBusinessUserDto => {
  const dto = new CreateBusinessUserDto();
  dto.email = 'agent@example.com';
  dto.firstName = 'John';
  dto.lastName = 'Doe';
  dto.password = 'Secure1!';
  dto.role = role;
  return dto;
};

describe('CreateBusinessUserHandler', () => {
  describe('execute() — success path', () => {
    it('should create a user with the requested AGENT role', async () => {
      const { handler, userRepository, passwordHasher, profileRepository } = makeHandler();

      const user = await handler.execute(validDto(UserRole.AGENT));

      expect(user).toBeDefined();
      expect(user.role).toBe(UserRole.AGENT);
      expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(profileRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create a user with the requested ADMINISTRATIVE role', async () => {
      const { handler } = makeHandler();
      const user = await handler.execute(validDto(UserRole.ADMINISTRATIVE));
      expect(user.role).toBe(UserRole.ADMINISTRATIVE);
    });

    it('should create the corresponding profile', async () => {
      const { handler, profileRepository } = makeHandler();
      await handler.execute(validDto(UserRole.AGENT));
      expect(profileRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute() — conflict path', () => {
    it('should throw AppException(CONFLICT) when the email is already registered', async () => {
      const { handler, userRepository } = makeHandler();
      const existingUser = {
        id: { toValue: () => 'existing-id' } as UserId,
        email: { value: 'agent@example.com' } as UserEmail,
      } as unknown as User;
      userRepository.findByEmail.mockResolvedValue(existingUser);

      let caught: unknown;
      try {
        await handler.execute(validDto());
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).code).toBe(ErrorCode.CONFLICT);
    });
  });
});
