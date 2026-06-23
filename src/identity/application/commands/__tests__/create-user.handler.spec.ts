import type { IDomainEventPublisher } from '@shared/domain';
import { type IPasswordHasher, type IUserRepository, User } from '@identity/domain';

import { CreateUserCommand, CreateUserHandler } from '../create-user.handler';

function makeCommand(
  overrides: Partial<{ email: string; firstName: string; lastName: string; password: string }> = {},
): CreateUserCommand {
  return new CreateUserCommand(
    overrides.email ?? 'test@example.com',
    overrides.firstName ?? 'John',
    overrides.lastName ?? 'Doe',
    overrides.password ?? 'Secure1!',
  );
}

function makeMockHasher(hashOverride = 'hashed-secure-1'): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn().mockResolvedValue(hashOverride),
    compare: jest.fn().mockResolvedValue(true),
  } as jest.Mocked<IPasswordHasher>;
}

function makeMockRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn().mockImplementation(async (user: User) => user),
    delete: jest.fn(),
  } as jest.Mocked<IUserRepository>;
}

function makeMockPublisher(): jest.Mocked<IDomainEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(),
  } as jest.Mocked<IDomainEventPublisher>;
}

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockHasher: jest.Mocked<IPasswordHasher>;
  let mockPublisher: jest.Mocked<IDomainEventPublisher>;

  beforeEach(() => {
    mockRepository = makeMockRepository();
    mockHasher = makeMockHasher();
    mockPublisher = makeMockPublisher();
    handler = new CreateUserHandler(mockRepository, mockHasher, mockPublisher);
  });

  describe('execute() — success path', () => {
    it('should create a User and return it', async () => {
      const user = await handler.execute(makeCommand());

      expect(user).toBeInstanceOf(User);
      expect(user.email.value).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
    });

    it('should hash the password via IPasswordHasher', async () => {
      await handler.execute(makeCommand());

      expect(mockHasher.hash).toHaveBeenCalledTimes(1);
    });

    it('should persist the User via IUserRepository.save()', async () => {
      await handler.execute(makeCommand());

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const saved = mockRepository.save.mock.calls[0]?.[0] as User;
      expect(saved).toBeInstanceOf(User);
      expect(saved.email.value).toBe('test@example.com');
    });

    it('should return the same aggregate instance the repository returned', async () => {
      const user = await handler.execute(makeCommand());

      const savedArg = (await mockRepository.save.mock.results[0]?.value) as User;
      expect(user).toBe(savedArg);
    });
  });

  describe('execute() — failure paths', () => {
    it('should throw when email is invalid', async () => {
      await expect(handler.execute(makeCommand({ email: 'not-an-email' }))).rejects.toThrow();
    });

    it('should throw when password is too short', async () => {
      await expect(handler.execute(makeCommand({ password: 'Short1' }))).rejects.toThrow();
    });

    it('should throw when password is missing uppercase', async () => {
      await expect(handler.execute(makeCommand({ password: 'secure1!' }))).rejects.toThrow();
    });

    it('should not call hasher.hash() or repository.save() when input is invalid', async () => {
      try {
        await handler.execute(makeCommand({ email: 'not-an-email' }));
      } catch {
        // expected — exception must propagate
      }

      expect(mockHasher.hash).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate the domain exception unchanged', async () => {
      try {
        await handler.execute(makeCommand({ email: 'not-an-email' }));
        throw new Error('handler should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid email format');
      }
    });
  });
});
