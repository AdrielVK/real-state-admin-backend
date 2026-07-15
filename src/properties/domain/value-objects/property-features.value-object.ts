import { DomainException, ErrorCode, ValueObject, type ValueObjectProps } from '@shared/domain';

import type { ConservationState } from '../enums/conservation-state.enum';
import type { PropertyType } from '../enums/property-type.enum';

export interface PropertyFeaturesProps extends ValueObjectProps {
  propertyType: PropertyType;
  conservationState: ConservationState | null;
  totalAreaM2: number | null;
  coveredAreaM2: number | null;
  uncoveredAreaM2: number | null;
  frontMeters: number | null;
  backMeters: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  toilettes: number | null;
  garages: number | null;
  floorNumber: number | null;
  unitIdentifier: string | null;
  constructionYear: number | null;
  orientation: string | null;
  serviceTags: readonly string[];
  amenityTags: readonly string[];
  conditionTags: readonly string[];
  extraFeatures: Readonly<Record<string, unknown>>;
}

export interface CreatePropertyFeaturesInput {
  propertyType: PropertyType;
  conservationState?: ConservationState | null;
  totalAreaM2?: number | null;
  coveredAreaM2?: number | null;
  uncoveredAreaM2?: number | null;
  frontMeters?: number | null;
  backMeters?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  toilettes?: number | null;
  garages?: number | null;
  floorNumber?: number | null;
  unitIdentifier?: string | null;
  constructionYear?: number | null;
  orientation?: string | null;
  serviceTags?: readonly string[];
  amenityTags?: readonly string[];
  conditionTags?: readonly string[];
  extraFeatures?: Readonly<Record<string, unknown>>;
}

export class PropertyFeatures extends ValueObject<PropertyFeaturesProps> {
  private constructor(props: PropertyFeaturesProps) {
    super({ ...props });
  }

  static create(input: CreatePropertyFeaturesInput): PropertyFeatures {
    if (input.propertyType === undefined || input.propertyType === null) {
      throw new DomainException('El tipo de propiedad es obligatorio', ErrorCode.VALIDATION_ERROR);
    }
    return new PropertyFeatures({
      propertyType: input.propertyType,
      conservationState: PropertyFeatures.toConservation(input.conservationState),
      totalAreaM2: PropertyFeatures.toNullableNumber(input.totalAreaM2),
      coveredAreaM2: PropertyFeatures.toNullableNumber(input.coveredAreaM2),
      uncoveredAreaM2: PropertyFeatures.toNullableNumber(input.uncoveredAreaM2),
      frontMeters: PropertyFeatures.toNullableNumber(input.frontMeters),
      backMeters: PropertyFeatures.toNullableNumber(input.backMeters),
      rooms: PropertyFeatures.toNullableNumber(input.rooms),
      bedrooms: PropertyFeatures.toNullableNumber(input.bedrooms),
      bathrooms: PropertyFeatures.toNullableNumber(input.bathrooms),
      toilettes: PropertyFeatures.toNullableNumber(input.toilettes),
      garages: PropertyFeatures.toNullableNumber(input.garages),
      floorNumber: PropertyFeatures.toNullableNumber(input.floorNumber),
      unitIdentifier: PropertyFeatures.toNullableString(input.unitIdentifier),
      constructionYear: PropertyFeatures.toNullableNumber(input.constructionYear),
      orientation: PropertyFeatures.toNullableString(input.orientation),
      serviceTags: PropertyFeatures.toFrozenStringArray(input.serviceTags),
      amenityTags: PropertyFeatures.toFrozenStringArray(input.amenityTags),
      conditionTags: PropertyFeatures.toFrozenStringArray(input.conditionTags),
      extraFeatures: PropertyFeatures.toFrozenRecord(input.extraFeatures),
    });
  }

  private static toConservation(
    value: ConservationState | null | undefined,
  ): ConservationState | null {
    return value ?? null;
  }

  private static toNullableNumber(value: number | null | undefined): number | null {
    return value ?? null;
  }

  private static toNullableString(value: string | null | undefined): string | null {
    return value ?? null;
  }

  private static toFrozenStringArray(value: readonly string[] | undefined): readonly string[] {
    return Object.freeze([...(value ?? [])]);
  }

  private static toFrozenRecord(
    value: Readonly<Record<string, unknown>> | undefined,
  ): Readonly<Record<string, unknown>> {
    return Object.freeze({ ...value });
  }

  get propertyType(): PropertyType {
    return this.props.propertyType;
  }

  get conservationState(): ConservationState | null {
    return this.props.conservationState;
  }

  get totalAreaM2(): number | null {
    return this.props.totalAreaM2;
  }

  get coveredAreaM2(): number | null {
    return this.props.coveredAreaM2;
  }

  get uncoveredAreaM2(): number | null {
    return this.props.uncoveredAreaM2;
  }

  get frontMeters(): number | null {
    return this.props.frontMeters;
  }

  get backMeters(): number | null {
    return this.props.backMeters;
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

  get toilettes(): number | null {
    return this.props.toilettes;
  }

  get garages(): number | null {
    return this.props.garages;
  }

  get floorNumber(): number | null {
    return this.props.floorNumber;
  }

  get unitIdentifier(): string | null {
    return this.props.unitIdentifier;
  }

  get constructionYear(): number | null {
    return this.props.constructionYear;
  }

  get orientation(): string | null {
    return this.props.orientation;
  }

  get serviceTags(): readonly string[] {
    return this.props.serviceTags;
  }

  get amenityTags(): readonly string[] {
    return this.props.amenityTags;
  }

  get conditionTags(): readonly string[] {
    return this.props.conditionTags;
  }

  get extraFeatures(): Readonly<Record<string, unknown>> {
    return this.props.extraFeatures;
  }
}
