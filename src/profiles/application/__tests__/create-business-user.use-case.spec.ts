import 'reflect-metadata';

import { ErrorCode, type IDomainEventPublisher, UserRole } from '@shared/domain';
import { AppException } from '@shared/presentation';

import type {
  IPasswordHasher,
  IUserRepository,
  User,
  UserEmail,
  UserId,
} from '../../../identity/domain';
import { CreateBusinessUserCommand } from '../commands/create-business-user.command';
import { CreateBusinessUserUseCase } from '../commands/create-business-user.use-case';
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

function makeMockEventPublisher(): jest.Mocked<IDomainEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IDomainEventPublisher>;
}

function makeUseCase() {
  const userRepository = makeMockUserRepository();
  const passwordHasher = makeMockPasswordHasher();
  const eventPublisher = makeMockEventPublisher();
  const useCase = new CreateBusinessUserUseCase(userRepository, passwordHasher, eventPublisher);
  return { useCase, userRepository, passwordHasher, eventPublisher };
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

const makeCommand = (dto: CreateBusinessUserDto): CreateBusinessUserCommand =>
  new CreateBusinessUserCommand(dto);

describe('CreateBusinessUserUseCase', () => {
  describe('execute() — success path', () => {
    it('should create a user with the requested AGENT role', async () => {
      const { useCase, userRepository, passwordHasher, eventPublisher } = makeUseCase();

      const user = await useCase.execute(makeCommand(validDto(UserRole.AGENT)));

      expect(user).toBeDefined();
      expect(user.role).toBe(UserRole.AGENT);
      expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should create a user with the requested ADMINISTRATIVE role', async () => {
      const { useCase } = makeUseCase();

      const user = await useCase.execute(makeCommand(validDto(UserRole.ADMINISTRATIVE)));

      expect(user.role).toBe(UserRole.ADMINISTRATIVE);
    });

    it('should hash the provided password via the password hasher', async () => {
      const { useCase, passwordHasher } = makeUseCase();
      const dto = validDto();

      await useCase.execute(makeCommand(dto));

      expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
      const hashedArg = passwordHasher.hash.mock.calls[0]?.[0];
      expect(hashedArg).toBeDefined();
    });

    it('should publish domain events after saving', async () => {
      const { useCase, eventPublisher } = makeUseCase();

      await useCase.execute(makeCommand(validDto()));

      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should check email uniqueness via the user repository', async () => {
      const { useCase, userRepository } = makeUseCase();
      const dto = validDto();

      await useCase.execute(makeCommand(dto));

      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute() — conflict path', () => {
    it('should throw AppException(CONFLICT) when the email is already registered', async () => {
      const { useCase, userRepository } = makeUseCase();
      const existingUser = {
        id: { toValue: () => 'existing-id' } as UserId,
        email: { value: 'agent@example.com' } as UserEmail,
      } as unknown as User;
      userRepository.findByEmail.mockResolvedValue(existingUser);

      let caught: unknown;
      try {
        await useCase.execute(makeCommand(validDto()));
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).code).toBe(ErrorCode.CONFLICT);
    });

    it('should not save or publish when the email is already registered', async () => {
      const { useCase, userRepository, passwordHasher, eventPublisher } = makeUseCase();
      const existingUser = {
        id: { toValue: () => 'existing-id' } as UserId,
        email: { value: 'agent@example.com' } as UserEmail,
      } as unknown as User;
      userRepository.findByEmail.mockResolvedValue(existingUser);

      try {
        await useCase.execute(makeCommand(validDto()));
      } catch {
        // expected
      }

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('execute() — domain authorization (handled at DTO/controller level)', () => {
    it('should only rely on caller being ADMIN; the use case trusts the input role for AGENT', async () => {
      const { useCase } = makeUseCase();

      const user = await useCase.execute(makeCommand(validDto(UserRole.AGENT)));

      expect(user.role).toBe(UserRole.AGENT);
    });
  });
});
