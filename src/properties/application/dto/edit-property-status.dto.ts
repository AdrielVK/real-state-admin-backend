import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Payload accepted by `PATCH /properties/:id/status`.
 *
 * Only structural validation (non-empty string). Semantic validation
 * (valid PropertyStatus + same-status rejection) lives in the domain
 * aggregate's `updateStatus()` method, which emits a proper
 * `DomainException` handled by the global `HttpExceptionFilter`.
 */
export class EditPropertyStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}
