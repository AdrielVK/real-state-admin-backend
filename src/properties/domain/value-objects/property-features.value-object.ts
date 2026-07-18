import { DomainException, ErrorCode, ValueObject, type ValueObjectProps } from '@shared/domain';

import { ConservationState } from '../enums/conservation-state.enum';

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

/**
 * Partial-update shape accepted by `Property.updateFeatures`.
 *
 * Distinguishes `undefined` (field omitted → keep existing value) from
 * `null`/value (field explicitly sent → replace or clear). Only the three
 * mandatory fields (totalAreaM2, coveredAreaM2, conservationState) are
 * non-optional on the first-creation path; all other fields can be left
 * `undefined` in any path.
 */
export interface EditPropertyFeaturesInput {
  totalAreaM2?: number;
  coveredAreaM2?: number;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  garages?: number | null;
  floor?: number | null;
  conservationState?: ConservationState | null;
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
    if (!Object.values(ConservationState).includes(props.conservationState)) {
      throw new DomainException(
        `"${props.conservationState}" no es un estado de conservación válido`,
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

  toPrimitives(): PropertyFeaturesProps {
    return { ...this.props };
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

  /**
   * Merge a partial update into the current features. `undefined` means "keep
   * existing", `null` means "clear", and a concrete value replaces. When
   * `current` is `null` the three mandatory fields must be present in `partial`
   * (caller is responsible for pre-validating).
   */
  static merge(
    current: PropertyFeatures | null,
    partial: EditPropertyFeaturesInput,
  ): PropertyFeatures {
    return new PropertyFeatures(PropertyFeatures.resolveMergedProps(current, partial));
  }

  // eslint-disable-next-line complexity -- 9-field data mapping; no branching complexity
  private static resolveMergedProps(
    current: PropertyFeatures | null,
    partial: EditPropertyFeaturesInput,
  ): PropertyFeaturesProps {
    return {
      totalAreaM2: resolveMandatoryField(partial.totalAreaM2, current?.totalAreaM2, 'totalAreaM2'),
      coveredAreaM2: resolveMandatoryField(
        partial.coveredAreaM2,
        current?.coveredAreaM2,
        'coveredAreaM2',
      ),
      rooms: resolveOptionalField(partial.rooms, current?.rooms ?? null),
      bedrooms: resolveOptionalField(partial.bedrooms, current?.bedrooms ?? null),
      bathrooms: resolveOptionalField(partial.bathrooms, current?.bathrooms ?? null),
      garages: resolveOptionalField(partial.garages, current?.garages ?? null),
      floor: resolveOptionalField(partial.floor, current?.floor ?? null),
      conservationState: resolveOptionalField(
        partial.conservationState,
        current?.conservationState ?? null,
      ),
      ageYears: resolveOptionalField(partial.ageYears, current?.ageYears ?? null),
    };
  }
}

function resolveOptionalField<T>(provided: T | undefined, current: T | null): T | null {
  if (provided === undefined) return current;
  return provided;
}

function resolveMandatoryField<T>(
  provided: T | undefined,
  current: T | undefined,
  fieldName: string,
): T {
  if (provided !== undefined) return provided;
  if (current !== undefined) return current;
  throw new DomainException(`${fieldName} es obligatorio`, ErrorCode.VALIDATION_ERROR);
}
