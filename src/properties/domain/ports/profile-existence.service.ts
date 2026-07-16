export interface IProfileExistenceService {
  agentExists(agentProfileId: string): Promise<boolean>;
  ownerExists(ownerProfileId: string): Promise<boolean>;
}

export const IProfileExistenceServiceToken = Symbol('IProfileExistenceService');
