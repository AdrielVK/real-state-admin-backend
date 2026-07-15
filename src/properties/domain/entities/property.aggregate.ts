import { AggregateRoot, DomainException, ErrorCode } from '@shared/domain';

import { PropertyStatus } from '../enums/property-status.enum';
import { PropertyCreatedEvent } from '../events/property-created.event';
import type { PropertyAddress } from '../value-objects/property-address.value-object';
import type { PropertyFeatures } from '../value-objects/property-features.value-object';
import { PropertyId } from '../value-objects/property-id.value-object';
import type { PropertyInternalId } from '../value-objects/property-internal-id.value-object';

interface PropertyProps {
  address: PropertyAddress;
  features: PropertyFeatures;
  internalId: PropertyInternalId | null;
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Property extends AggregateRoot<PropertyId> {
  private readonly _address: PropertyAddress;
  private readonly _features: PropertyFeatures;
  private readonly _internalId: PropertyInternalId | null;
  private _status: PropertyStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: PropertyId, props: PropertyProps) {
    super(id);
    this._address = props.address;
    this._features = props.features;
    this._internalId = props.internalId;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(
    address: PropertyAddress,
    features: PropertyFeatures,
    internalId: PropertyInternalId | null = null,
  ): Property {
    const id = PropertyId.generate();
    const now = new Date();
    const property = new Property(id, {
      address,
      features,
      internalId,
      status: PropertyStatus.DISPONIBLE,
      createdAt: now,
      updatedAt: now,
    });
    property.addDomainEvent(
      new PropertyCreatedEvent(
        id.toValue(),
        address.placeId,
        PropertyStatus.DISPONIBLE,
        internalId?.value ?? null,
      ),
    );
    return property;
  }

  static reconstitute(
    id: PropertyId,
    address: PropertyAddress,
    features: PropertyFeatures,
    internalId: PropertyInternalId | null,
    status: PropertyStatus,
    createdAt: Date,
    updatedAt: Date,
  ): Property {
    return new Property(id, {
      address,
      features,
      internalId,
      status,
      createdAt,
      updatedAt,
    });
  }

  archive(): void {
    if (this._status !== PropertyStatus.DISPONIBLE) {
      throw new DomainException(
        `No se puede archivar una propiedad en estado ${this._status}`,
        ErrorCode.VALIDATION_ERROR,
      );
    }
    this._status = PropertyStatus.ARCHIVADO;
    this._updatedAt = new Date();
  }

  markUnderContract(): void {
    if (this._status !== PropertyStatus.DISPONIBLE) {
      throw new DomainException(
        `No se puede marcar bajo contrato una propiedad en estado ${this._status}`,
        ErrorCode.VALIDATION_ERROR,
      );
    }
    this._status = PropertyStatus.BAJO_CONTRATO;
    this._updatedAt = new Date();
  }

  get address(): PropertyAddress {
    return this._address;
  }

  get features(): PropertyFeatures {
    return this._features;
  }

  get internalId(): PropertyInternalId | null {
    return this._internalId;
  }

  get status(): PropertyStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  toPrimitives(): Record<string, unknown> {
    return {
      id: this.id.toValue(),
      address: {
        placeId: this._address.placeId,
        formatted: this._address.formatted,
        street: this._address.street,
        streetNumber: this._address.streetNumber,
        floor: this._address.floor,
        apartment: this._address.apartment,
        neighborhood: this._address.neighborhood,
        city: this._address.city,
        province: this._address.province,
        country: this._address.country,
        postalCode: this._address.postalCode,
        latitude: this._address.latitude,
        longitude: this._address.longitude,
      },
      features: {
        propertyType: this._features.propertyType,
        conservationState: this._features.conservationState,
        totalAreaM2: this._features.totalAreaM2,
        coveredAreaM2: this._features.coveredAreaM2,
        uncoveredAreaM2: this._features.uncoveredAreaM2,
        frontMeters: this._features.frontMeters,
        backMeters: this._features.backMeters,
        rooms: this._features.rooms,
        bedrooms: this._features.bedrooms,
        bathrooms: this._features.bathrooms,
        toilettes: this._features.toilettes,
        garages: this._features.garages,
        floorNumber: this._features.floorNumber,
        unitIdentifier: this._features.unitIdentifier,
        constructionYear: this._features.constructionYear,
        orientation: this._features.orientation,
        serviceTags: [...this._features.serviceTags],
        amenityTags: [...this._features.amenityTags],
        conditionTags: [...this._features.conditionTags],
        extraFeatures: { ...this._features.extraFeatures },
      },
      internalId: this._internalId?.value ?? null,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
