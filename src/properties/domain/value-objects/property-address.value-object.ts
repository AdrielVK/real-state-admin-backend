import { DomainException, ErrorCode, ValueObject, type ValueObjectProps } from '@shared/domain';

export interface PropertyAddressProps extends ValueObjectProps {
  addressPlaceId: string | null;
  addressFormatted: string;
  addressStreet: string | null;
  addressStreetNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string;
  addressState: string | null;
  addressCountry: string;
  addressPostalCode: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
}

export class PropertyAddress extends ValueObject<PropertyAddressProps> {
  constructor(props: PropertyAddressProps) {
    if (!props.addressFormatted || props.addressFormatted.trim() === '') {
      throw new DomainException(
        'La dirección formateada es obligatoria',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!props.addressCity || props.addressCity.trim() === '') {
      throw new DomainException(
        'La ciudad de la dirección es obligatoria',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!props.addressCountry || props.addressCountry.trim() === '') {
      throw new DomainException(
        'El país de la dirección es obligatorio',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (
      props.addressLatitude !== null &&
      (props.addressLatitude < -90 || props.addressLatitude > 90)
    ) {
      throw new DomainException('La latitud debe estar entre -90 y 90', ErrorCode.VALIDATION_ERROR);
    }
    if (
      props.addressLongitude !== null &&
      (props.addressLongitude < -180 || props.addressLongitude > 180)
    ) {
      throw new DomainException(
        'La longitud debe estar entre -180 y 180',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    super({
      addressPlaceId: props.addressPlaceId,
      addressFormatted: props.addressFormatted,
      addressStreet: props.addressStreet,
      addressStreetNumber: props.addressStreetNumber,
      addressNeighborhood: props.addressNeighborhood,
      addressCity: props.addressCity,
      addressState: props.addressState,
      addressCountry: props.addressCountry,
      addressPostalCode: props.addressPostalCode,
      addressLatitude: props.addressLatitude,
      addressLongitude: props.addressLongitude,
    });
  }

  get addressPlaceId(): string | null {
    return this.props.addressPlaceId;
  }
  get addressFormatted(): string {
    return this.props.addressFormatted;
  }
  get addressStreet(): string | null {
    return this.props.addressStreet;
  }
  get addressStreetNumber(): string | null {
    return this.props.addressStreetNumber;
  }
  get addressNeighborhood(): string | null {
    return this.props.addressNeighborhood;
  }
  get addressCity(): string {
    return this.props.addressCity;
  }
  get addressState(): string | null {
    return this.props.addressState;
  }
  get addressCountry(): string {
    return this.props.addressCountry;
  }
  get addressPostalCode(): string | null {
    return this.props.addressPostalCode;
  }
  get addressLatitude(): number | null {
    return this.props.addressLatitude;
  }
  get addressLongitude(): number | null {
    return this.props.addressLongitude;
  }

  toPrimitives(): PropertyAddressProps {
    return { ...this.props };
  }

  static fromCreateDto(dto: {
    addressPlaceId?: string | null;
    addressFormatted: string;
    addressStreet?: string | null;
    addressStreetNumber?: string | null;
    addressNeighborhood?: string | null;
    addressCity: string;
    addressState?: string | null;
    addressCountry: string;
    addressPostalCode?: string | null;
    addressLatitude?: number | null;
    addressLongitude?: number | null;
  }): PropertyAddress {
    return new PropertyAddress({
      addressPlaceId: dto.addressPlaceId ?? null,
      addressFormatted: dto.addressFormatted,
      addressStreet: dto.addressStreet ?? null,
      addressStreetNumber: dto.addressStreetNumber ?? null,
      addressNeighborhood: dto.addressNeighborhood ?? null,
      addressCity: dto.addressCity,
      addressState: dto.addressState ?? null,
      addressCountry: dto.addressCountry,
      addressPostalCode: dto.addressPostalCode ?? null,
      addressLatitude: dto.addressLatitude ?? null,
      addressLongitude: dto.addressLongitude ?? null,
    });
  }
}
