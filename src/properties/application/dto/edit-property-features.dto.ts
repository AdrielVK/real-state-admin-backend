import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

import { ConservationState } from '@properties/domain/enums/conservation-state.enum';

/**
 * Payload accepted by `PATCH /properties/:id/features`.
 *
 * All fields are optional so the endpoint supports partial updates. The
 * merge semantics are: `undefined` (omitted) → keep existing value, `null`
 * (explicit) → clear the field, concrete value → replace. On the first
 * creation path (current features is null), totalAreaM2, coveredAreaM2 and
 * conservationState are enforced as mandatory by the aggregate.
 */
export class EditPropertyFeaturesDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  totalAreaM2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  coveredAreaM2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rooms?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bedrooms?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bathrooms?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  garages?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  floor?: number | null;

  @IsOptional()
  @IsEnum(ConservationState)
  conservationState?: ConservationState | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ageYears?: number | null;
}
