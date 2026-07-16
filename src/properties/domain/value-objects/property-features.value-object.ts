import { DomainException, ErrorCode, ValueObject, type ValueObjectProps } from '@shared/domain';

import type { ConservationState } from '../enums/conservation-state.enum';

export interface PropertyFeaturesProps extends ValueObjectProps {
  totalAreaM2: number;
  coveredAreaM2: number;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  floor: number | null;
  conservationState: ConservationState | null;
  ageYears: number | null;
}

/** Input shape accepted by PropertyFeatures.fromCreateDto. Mirrors CreatePropertyFeaturesDto. */
export interface CreatePropertyFeaturesInput {
  totalAreaM2: number;
  coveredAreaM2: number;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  floor?: number | null;
  conservationState: ConservationState;
  ageYears?: number | null;
}

function ensurePositive(field: string, value: number | null): void {
  if (value === null || value === undefined) return;
  if (value <= 0) {
    throw new DomainException(`${field} debe ser un número positivo`, ErrorCode.VALIDATION_ERROR);
  }
}

function ensureNonNegative(field: string, value: number | null): void {
  if (value === null || value === undefined) return;
  if (value < 0) {
    throw new DomainException(`${field} no puede ser negativo`, ErrorCode.VALIDATION_ERROR);
  }
}

export class PropertyFeatures extends ValueObject<PropertyFeaturesProps> {
  constructor(props: PropertyFeaturesProps) {
    ensurePositive('totalAreaM2', props.totalAreaM2);
    ensurePositive('coveredAreaM2', props.coveredAreaM2);
    ensureNonNegative('rooms', props.rooms);
    ensureNonNegative('bedrooms', props.bedrooms);
    ensureNonNegative('bathrooms', props.bathrooms);
    ensureNonNegative('garages', props.garages);
    if (props.floor !== null && props.floor !== undefined && props.floor < 0) {
      throw new DomainException('floor no puede ser negativo', ErrorCode.VALIDATION_ERROR);
    }
    if (props.ageYears !== null && props.ageYears !== undefined && props.ageYears < 0) {
      throw new DomainException('ageYears no puede ser negativo', ErrorCode.VALIDATION_ERROR);
    }
    if (!props.conservationState) {
      throw new DomainException(
        'El estado de conservación es obligatorio',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    super({
      totalAreaM2: props.totalAreaM2,
      coveredAreaM2: props.coveredAreaM2,
      rooms: props.rooms ?? null,
      bedrooms: props.bedrooms ?? null,
      bathrooms: props.bathrooms ?? null,
      garages: props.garages ?? null,
      floor: props.floor ?? null,
      conservationState: props.conservationState,
      ageYears: props.ageYears ?? null,
    });
  }

  get totalAreaM2(): number {
    return this.props.totalAreaM2;
  }
  get coveredAreaM2(): number {
    return this.props.coveredAreaM2;
  }
  get rooms(): number | null {
    return this.props.rooms;
  }
  get bedrooms(): number | null {
    return this.props.bedrooms;
  }
  get bathrooms(): number | null {
    return this.props.bathrooms;
  }
  get garages(): number | null {
    return this.props.garages;
  }
  get floor(): number | null {
    return this.props.floor;
  }
  get conservationState(): ConservationState | null {
    return this.props.conservationState;
  }
  get ageYears(): number | null {
    return this.props.ageYears;
  }

  static fromCreateDto(dto: CreatePropertyFeaturesInput): PropertyFeatures {
    return new PropertyFeatures({
      totalAreaM2: dto.totalAreaM2,
      coveredAreaM2: dto.coveredAreaM2,
      rooms: dto.rooms ?? null,
      bedrooms: dto.bedrooms ?? null,
      bathrooms: dto.bathrooms ?? null,
      garages: dto.garages ?? null,
      floor: dto.floor ?? null,
      conservationState: dto.conservationState,
      ageYears: dto.ageYears ?? null,
    });
  }
}
