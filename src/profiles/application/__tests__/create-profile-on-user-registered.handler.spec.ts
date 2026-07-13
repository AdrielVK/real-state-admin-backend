import type { IProfileRepository, Profile } from '@profiles/domain';
import type { ProfileId } from '@profiles/domain';

import { AdminProfile } from '../../domain/entities/admin-profile.aggregate';
import { AdministrativeProfile } from '../../domain/entities/administrative-profile.aggregate';
import { AgentProfile } from '../../domain/entities/agent-profile.aggregate';
import { ClientProfile } from '../../domain/entities/client-profile.aggregate';
import { VisitorProfile } from '../../domain/entities/visitor-profile.aggregate';
import { CreateProfileOnUserRegisteredHandler } from '../handlers/create-profile-on-user-registered.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const PROFILE_UUID = '550e8400-e29b-41d4-a716-446655440001';

function makeMockRepository(): jest.Mocked<IProfileRepository> {
  return {
    findByUserId: jest.fn(),
    save: jest.fn().mockImplementation(async (profile: Profile<ProfileId>) => profile),
  } as jest.Mocked<IProfileRepository>;
}

function getHandlerLogger(handler: CreateProfileOnUserRegisteredHandler): {
  error: (message: string, trace?: string) => void;
} {
  return (handler as unknown as { logger: { error: (message: string, trace?: string) => void } })
    .logger;
}

describe('CreateProfileOnUserRegisteredHandler', () => {
  let handler: CreateProfileOnUserRegisteredHandler;
  let mockRepository: jest.Mocked<IProfileRepository>;

  beforeEach(() => {
    mockRepository = makeMockRepository();
    handler = new CreateProfileOnUserRegisteredHandler(mockRepository);
  });

  describe('handle() — success path', () => {
    it('should look up the user by id and skip creation when a profile already exists', async () => {
      const existing = AgentProfile.reconstitute(PROFILE_UUID, USER_ID, new Date(), new Date());
      mockRepository.findByUserId.mockResolvedValue(existing);

      await handler.handle({ userId: USER_ID, role: 'AGENT' });

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create a profile when none exists, using the role from the event', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);

      await handler.handle({ userId: USER_ID, role: 'AGENT' });

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const saved = mockRepository.save.mock.calls[0]?.[0] as Profile<ProfileId>;
      expect(saved).toBeInstanceOf(AgentProfile);
      expect(saved.userId).toBe(USER_ID);
    });

    it('should map role AGENT to AgentProfile', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      await handler.handle({ userId: USER_ID, role: 'AGENT' });
      const saved = mockRepository.save.mock.calls[0]?.[0] as Profile<ProfileId>;
      expect(saved).toBeInstanceOf(AgentProfile);
    });

    it('should map role ADMIN to AdminProfile', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      await handler.handle({ userId: USER_ID, role: 'ADMIN' });
      const saved = mockRepository.save.mock.calls[0]?.[0] as Profile<ProfileId>;
      expect(saved).toBeInstanceOf(AdminProfile);
    });

    it('should map role ADMINISTRATIVE to AdministrativeProfile', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      await handler.handle({ userId: USER_ID, role: 'ADMINISTRATIVE' });
      const saved = mockRepository.save.mock.calls[0]?.[0] as Profile<ProfileId>;
      expect(saved).toBeInstanceOf(AdministrativeProfile);
    });

    it('should map role CLIENT to ClientProfile', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      await handler.handle({ userId: USER_ID, role: 'CLIENT' });
      const saved = mockRepository.save.mock.calls[0]?.[0] as Profile<ProfileId>;
      expect(saved).toBeInstanceOf(ClientProfile);
    });

    it('should map role VISITOR to VisitorProfile', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      await handler.handle({ userId: USER_ID, role: 'VISITOR' });
      const saved = mockRepository.save.mock.calls[0]?.[0] as Profile<ProfileId>;
      expect(saved).toBeInstanceOf(VisitorProfile);
    });
  });

  describe('handle() — idempotency', () => {
    it('should not save a second profile when one already exists for the same user', async () => {
      const existing = AgentProfile.reconstitute(PROFILE_UUID, USER_ID, new Date(), new Date());
      mockRepository.findByUserId.mockResolvedValue(existing);

      await handler.handle({ userId: USER_ID, role: 'AGENT' });

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should be safe to invoke twice in a row with the same payload', async () => {
      const existing = AgentProfile.reconstitute(PROFILE_UUID, USER_ID, new Date(), new Date());
      mockRepository.findByUserId.mockResolvedValue(existing);

      await handler.handle({ userId: USER_ID, role: 'AGENT' });
      await handler.handle({ userId: USER_ID, role: 'AGENT' });

      expect(mockRepository.findByUserId).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handle() — error path', () => {
    it('should log and swallow errors thrown by the repository on findByUserId', async () => {
      const loggerErrorSpy = jest.spyOn(getHandlerLogger(handler), 'error');
      mockRepository.findByUserId.mockRejectedValue(new Error('database down'));

      await expect(handler.handle({ userId: USER_ID, role: 'AGENT' })).resolves.toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalled();
      loggerErrorSpy.mockRestore();
    });

    it('should log and swallow errors thrown by save', async () => {
      const loggerErrorSpy = jest.spyOn(getHandlerLogger(handler), 'error');
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.save.mockRejectedValue(new Error('upsert failed'));

      await expect(handler.handle({ userId: USER_ID, role: 'AGENT' })).resolves.toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalled();
      loggerErrorSpy.mockRestore();
    });

    it('should log and swallow errors thrown by an unknown role', async () => {
      const loggerErrorSpy = jest.spyOn(getHandlerLogger(handler), 'error');
      mockRepository.findByUserId.mockResolvedValue(null);

      await expect(handler.handle({ userId: USER_ID, role: 'GHOST' })).resolves.toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalled();
      loggerErrorSpy.mockRestore();
    });
  });
});
