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

function makeMockEventPublisher(): jest.Mocked<IDomainEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IDomainEventPublisher>;
}

function makeHandler() {
  const userRepository = makeMockUserRepository();
  const passwordHasher = makeMockPasswordHasher();
  const eventPublisher = makeMockEventPublisher();
  const handler = new CreateBusinessUserHandler(userRepository, passwordHasher, eventPublisher);
  return { handler, userRepository, passwordHasher, eventPublisher };
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
      const { handler, userRepository, passwordHasher, eventPublisher } = makeHandler();

      const user = await handler.execute(validDto(UserRole.AGENT));

      expect(user).toBeDefined();
      expect(user.role).toBe(UserRole.AGENT);
      expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should create a user with the requested ADMINISTRATIVE role', async () => {
      const { handler } = makeHandler();

      const user = await handler.execute(validDto(UserRole.ADMINISTRATIVE));

      expect(user.role).toBe(UserRole.ADMINISTRATIVE);
    });

    it('should hash the provided password via the password hasher', async () => {
      const { handler, passwordHasher } = makeHandler();
      const dto = validDto();

      await handler.execute(dto);

      expect(passwordHasher.hash).toHaveBeenCalledTimes(1);
      const hashedArg = passwordHasher.hash.mock.calls[0]?.[0];
      expect(hashedArg).toBeDefined();
    });

    it('should publish domain events after saving', async () => {
      const { handler, eventPublisher } = makeHandler();

      await handler.execute(validDto());

      expect(eventPublisher.publish).toHaveBeenCalled();
    });

    it('should check email uniqueness via the user repository', async () => {
      const { handler, userRepository } = makeHandler();
      const dto = validDto();

      await handler.execute(dto);

      expect(userRepository.findByEmail).toHaveBeenCalledTimes(1);
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

    it('should not save or publish when the email is already registered', async () => {
      const { handler, userRepository, passwordHasher, eventPublisher } = makeHandler();
      const existingUser = {
        id: { toValue: () => 'existing-id' } as UserId,
        email: { value: 'agent@example.com' } as UserEmail,
      } as unknown as User;
      userRepository.findByEmail.mockResolvedValue(existingUser);

      try {
        await handler.execute(validDto());
      } catch {
        // expected
      }

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(eventPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('execute() — domain authorization (handled at DTO/controller level)', () => {
    it('should only rely on caller being ADMIN; the handler trusts the input role for AGENT', async () => {
      const { handler } = makeHandler();

      const user = await handler.execute(validDto(UserRole.AGENT));

      expect(user.role).toBe(UserRole.AGENT);
    });
  });
});
