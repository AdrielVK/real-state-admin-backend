import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { CharacteristicCategory } from '@properties/domain/enums/characteristic-category.enum';
import { ConservationState } from '@properties/domain/enums/conservation-state.enum';
import { PropertyStatus } from '@properties/domain/enums/property-status.enum';
import { PropertyType } from '@properties/domain/enums/property-type.enum';

export class CreatePropertyAddressDto {
  @IsOptional()
  @IsString()
  addressPlaceId?: string | null;

  @IsString()
  @IsNotEmpty()
  addressFormatted!: string;

  @IsOptional()
  @IsString()
  addressStreet?: string | null;

  @IsOptional()
  @IsString()
  addressStreetNumber?: string | null;

  @IsOptional()
  @IsString()
  addressNeighborhood?: string | null;

  @IsString()
  @IsNotEmpty()
  addressCity!: string;

  @IsOptional()
  @IsString()
  addressState?: string | null;

  @IsString()
  @IsNotEmpty()
  addressCountry!: string;

  @IsOptional()
  @IsString()
  addressPostalCode?: string | null;

  @IsOptional()
  @IsLatitude()
  addressLatitude?: number | null;

  @IsOptional()
  @IsLongitude()
  addressLongitude?: number | null;
}

export class CreatePropertyFeaturesDto {
  @IsNumber()
  @Min(0.01)
  totalAreaM2!: number;

  @IsNumber()
  @Min(0.01)
  coveredAreaM2!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rooms?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  garages?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  floor?: number | null;

  @IsEnum(ConservationState)
  conservationState!: ConservationState;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ageYears?: number | null;
}

export class CreatePropertyCharacteristicDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsEnum(CharacteristicCategory)
  category!: CharacteristicCategory;
}

export class CreatePropertyDto {
  @IsOptional()
  @IsString()
  internalCode?: string | null;

  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ValidateNested()
  @Type(() => CreatePropertyAddressDto)
  address!: CreatePropertyAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePropertyFeaturesDto)
  features?: CreatePropertyFeaturesDto;

  @IsOptional()
  @IsUUID()
  ownerProfileId?: string | null;

  @IsOptional()
  @IsUUID()
  agentProfileId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyCharacteristicDto)
  characteristics?: CreatePropertyCharacteristicDto[];
}
