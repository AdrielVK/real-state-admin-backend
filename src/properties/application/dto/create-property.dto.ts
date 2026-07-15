import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';

export class PropertyAddressDto {
  @IsString()
  @IsNotEmpty()
  placeId!: string;

  @IsString()
  @IsNotEmpty()
  formatted!: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  streetNumber?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsLatitude()
  @Type(() => Number)
  latitude!: number;

  @IsLongitude()
  @Type(() => Number)
  longitude!: number;
}

export class PropertyFeaturesDto {
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsOptional()
  @IsEnum(ConservationState)
  conservationState?: ConservationState;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAreaM2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coveredAreaM2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  uncoveredAreaM2?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  frontMeters?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  backMeters?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  toilettes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  garages?: number;

  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(200)
  floorNumber?: number;

  @IsOptional()
  @IsString()
  unitIdentifier?: string;

  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Max(2200)
  constructionYear?: number;

  @IsOptional()
  @IsString()
  orientation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenityTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditionTags?: string[];

  @IsOptional()
  @IsObject()
  extraFeatures?: Record<string, unknown>;
}

export class CreatePropertyDto {
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address!: PropertyAddressDto;

  @ValidateNested()
  @Type(() => PropertyFeaturesDto)
  features!: PropertyFeaturesDto;

  @IsOptional()
  @IsString()
  @Length(7, 7)
  @Matches(/^[A-Za-z0-9]{7}$/)
  internalId?: string;
}
