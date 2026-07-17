import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Payload accepted by `PATCH /properties/:id/address`.
 *
 * Mirrors `CreatePropertyAddressDto` field-for-field so the request body for
 * editing a property's address matches the address fields sent on creation.
 * Same class-validator decorators → identical validation surface, so any
 * additional constraint added to the create flow propagates to this one.
 */
export class EditPropertyAddressDto {
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
