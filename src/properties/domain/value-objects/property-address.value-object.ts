import { DomainException, ErrorCode, ValueObject, type ValueObjectProps } from '@shared/domain';

export interface PropertyAddressProps extends ValueObjectProps {
  placeId: string;
  formatted: string;
  street: string | null;
  streetNumber: string | null;
  floor: string | null;
  apartment: string | null;
  neighborhood: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

export class PropertyAddress extends ValueObject<PropertyAddressProps> {
  constructor(props: {
    placeId: string;
    formatted: string;
    latitude: number;
    longitude: number;
    street?: string | null;
    streetNumber?: string | null;
    floor?: string | null;
    apartment?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    postalCode?: string | null;
  }) {
    PropertyAddress.assertValidPlaceId(props.placeId);
    PropertyAddress.assertValidFormatted(props.formatted);
    PropertyAddress.assertValidLatitude(props.latitude);
    PropertyAddress.assertValidLongitude(props.longitude);
    super({
      placeId: props.placeId,
      formatted: props.formatted,
      street: PropertyAddress.toNullableString(props.street),
      streetNumber: PropertyAddress.toNullableString(props.streetNumber),
      floor: PropertyAddress.toNullableString(props.floor),
      apartment: PropertyAddress.toNullableString(props.apartment),
      neighborhood: PropertyAddress.toNullableString(props.neighborhood),
      city: PropertyAddress.toNullableString(props.city),
      province: PropertyAddress.toNullableString(props.province),
      country: PropertyAddress.toNullableString(props.country),
      postalCode: PropertyAddress.toNullableString(props.postalCode),
      latitude: props.latitude,
      longitude: props.longitude,
    });
  }

  private static toNullableString(value: string | null | undefined): string | null {
    return value ?? null;
  }

  private static assertValidPlaceId(placeId: string): void {
    if (!placeId || placeId.trim().length === 0) {
      throw new DomainException('El placeId es obligatorio', ErrorCode.VALIDATION_ERROR);
    }
  }

  private static assertValidFormatted(formatted: string): void {
    if (!formatted || formatted.trim().length === 0) {
      throw new DomainException(
        'La dirección formateada es obligatoria',
        ErrorCode.VALIDATION_ERROR,
      );
    }
  }

  private static assertValidLatitude(latitude: number): void {
    if (Number.isNaN(latitude) || latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
      throw new DomainException('La latitud debe estar entre -90 y 90', ErrorCode.VALIDATION_ERROR);
    }
  }

  private static assertValidLongitude(longitude: number): void {
    if (Number.isNaN(longitude) || longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
      throw new DomainException(
        'La longitud debe estar entre -180 y 180',
        ErrorCode.VALIDATION_ERROR,
      );
    }
  }

  get placeId(): string {
    return this.props.placeId;
  }

  get formatted(): string {
    return this.props.formatted;
  }

  get street(): string | null {
    return this.props.street;
  }

  get streetNumber(): string | null {
    return this.props.streetNumber;
  }

  get floor(): string | null {
    return this.props.floor;
  }

  get apartment(): string | null {
    return this.props.apartment;
  }

  get neighborhood(): string | null {
    return this.props.neighborhood;
  }

  get city(): string | null {
    return this.props.city;
  }

  get province(): string | null {
    return this.props.province;
  }

  get country(): string | null {
    return this.props.country;
  }

  get postalCode(): string | null {
    return this.props.postalCode;
  }

  get latitude(): number {
    return this.props.latitude;
  }

  get longitude(): number {
    return this.props.longitude;
  }

  // Equality is anchored to placeId — the canonical address identifier from
  // the place resolver. Two addresses that resolve to the same placeId are
  // considered the same address even if other components drift.
  override equals(other: ValueObject<PropertyAddressProps>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.props.placeId === other.props.placeId;
  }
}
