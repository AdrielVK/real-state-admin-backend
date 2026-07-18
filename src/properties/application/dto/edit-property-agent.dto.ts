import { IsOptional, IsUUID } from 'class-validator';

/**
 * Payload accepted by `PATCH /properties/:id/agent`.
 *
 * `agentProfileId` is optional and nullable: omit the key to keep the current
 * value, send a UUID to assign an agent, send `null` to remove the current
 * agent.
 *
 * Note: the use case enforces the rule that the value is meaningful
 * (different from the current one). This DTO is just a structural shape.
 */
export class EditPropertyAgentDto {
  @IsOptional()
  @IsUUID()
  agentProfileId?: string | null;
}
