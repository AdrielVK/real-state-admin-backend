import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CharacteristicCategory } from '@properties/domain/enums/characteristic-category.enum';

import { CreatePropertyCharacteristicDto } from './create-property.dto';

/**
 * Payload accepted by `PATCH /properties/:id/characteristics`.
 *
 * The endpoint is additive and decremental: at least one of `add` or `remove`
 * must contain entries. Adding a characteristic uses the same shape as the
 * create-property endpoint (`name`, `slug`, `category`); removing one is
 * identity-only (`slug`, `category`) because the property is the source of
 * truth for the name.
 */
export class RemoveCharacteristicDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsEnum(CharacteristicCategory)
  category!: CharacteristicCategory;
}

export class EditPropertyCharacteristicsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyCharacteristicDto)
  add?: CreatePropertyCharacteristicDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RemoveCharacteristicDto)
  remove?: RemoveCharacteristicDto[];
}
