import { AggregateRoot, DomainException, ErrorCode } from '@shared/domain';

import type { CharacteristicCategory } from '../enums/characteristic-category.enum';
import { PropertyStatus } from '../enums/property-status.enum';
import type { PropertyType } from '../enums/property-type.enum';
import { PropertyAddressChangedEvent } from '../events/property-address-changed.event';
import { PropertyCreatedEvent } from '../events/property-created.event';
import { PropertyDeletedEvent } from '../events/property-deleted.event';
import { PropertyStatusChangedEvent } from '../events/property-status-changed.event';
import type { PropertyAddress } from '../value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../value-objects/property-characteristic.value-object';
import type { PropertyFeatures } from '../value-objects/property-features.value-object';
import { PropertyId } from '../value-objects/property-id.value-object';

export interface PropertyCreateInput {
  internalCode?: string | null;
  address: PropertyAddress;
  propertyType: PropertyType;
  status?: PropertyStatus;
  features?: PropertyFeatures | null;
  ownerProfileId?: string | null;
  agentProfileId?: string | null;
  characteristics?: PropertyCharacteristicValue[];
  createdByUserId?: string | null;
}

export interface PropertyReconstituteInput {
  id: PropertyId;
  internalCode: string | null;
  address: PropertyAddress;
  propertyType: PropertyType;
  status: PropertyStatus;
  features: PropertyFeatures | null;
  ownerProfileId: string | null;
  agentProfileId: string | null;
  characteristics: PropertyCharacteristicValue[];
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface PropertyInternalState {
  internalCode: string | null;
  address: PropertyAddress;
  propertyType: PropertyType;
  status: PropertyStatus;
  features: PropertyFeatures | null;
  ownerProfileId: string | null;
  agentProfileId: string | null;
  characteristics: PropertyCharacteristicValue[];
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Property extends AggregateRoot<PropertyId> {
  private readonly _state: PropertyInternalState;

  private constructor(id: PropertyId, state: PropertyInternalState) {
    super(id);
    this._state = state;
  }

  static create(input: PropertyCreateInput): Property {
    if (input.internalCode?.trim() === '') {
      throw new DomainException(
        'El código interno no puede estar vacío',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!input.propertyType) {
      throw new DomainException('El tipo de propiedad es obligatorio', ErrorCode.VALIDATION_ERROR);
    }
    if (!input.address) {
      throw new DomainException(
        'La dirección de la propiedad es obligatoria',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const id = PropertyId.generate();
    const now = new Date();
    const property = new Property(id, {
      internalCode: input.internalCode ?? null,
      address: input.address,
      propertyType: input.propertyType,
      status: input.status ?? PropertyStatus.DISPONIBLE,
      features: input.features ?? null,
      ownerProfileId: input.ownerProfileId ?? null,
      agentProfileId: input.agentProfileId ?? null,
      characteristics: input.characteristics ?? [],
      createdByUserId: input.createdByUserId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    property.addDomainEvent(
      new PropertyCreatedEvent(
        id.toValue(),
        input.internalCode ?? null,
        input.propertyType,
        input.createdByUserId ?? null,
      ),
    );

    return property;
  }

  static reconstitute(input: PropertyReconstituteInput): Property {
    return new Property(input.id, {
      internalCode: input.internalCode,
      address: input.address,
      propertyType: input.propertyType,
      status: input.status,
      features: input.features,
      ownerProfileId: input.ownerProfileId,
      agentProfileId: input.agentProfileId,
      characteristics: [...input.characteristics],
      createdByUserId: input.createdByUserId,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      deletedAt: input.deletedAt,
    });
  }

  addCharacteristic(characteristic: PropertyCharacteristicValue): void {
    if (
      this._state.characteristics.some(
        (existing) =>
          existing.slug === characteristic.slug && existing.category === characteristic.category,
      )
    ) {
      return;
    }
    this._state.characteristics.push(characteristic);
    this._state.updatedAt = new Date();
  }

  removeCharacteristic(slug: string, category: CharacteristicCategory): void {
    const next = this._state.characteristics.filter(
      (c) => !(c.slug === slug && c.category === category),
    );
    if (next.length === this._state.characteristics.length) {
      return;
    }
    this._state.characteristics = next;
    this._state.updatedAt = new Date();
  }

  /**
   * After the repository has upserted each tag, the resolved numeric ids need to be
   * reflected back into the aggregate's VOs so the response shape exposes them.
   * Order is preserved: position `i` in `resolvedIds` maps to position `i` in
   * `this._state.characteristics`.
   */
  syncCharacteristicIds(resolvedIds: number[]): void {
    for (let i = 0; i < resolvedIds.length && i < this._state.characteristics.length; i++) {
      const vo = this._state.characteristics[i];
      const id = resolvedIds[i];
      if (!vo || id === undefined) continue;
      this._state.characteristics[i] = PropertyCharacteristicValue.fromPersistence(
        id,
        vo.name,
        vo.slug,
        vo.category,
      );
    }
  }

  softDelete(): void {
    if (this._state.deletedAt !== null) return;
    this._state.deletedAt = new Date();
    this._state.updatedAt = new Date();
    this.addDomainEvent(new PropertyDeletedEvent(this.id.toValue()));
  }

  updateAddress(address: PropertyAddress): void {
    if (this._state.address.equals(address)) {
      return;
    }
    const oldAddress = this._state.address;
    const changedAt = new Date();
    this._state.address = address;
    this._state.updatedAt = changedAt;
    this.addDomainEvent(
      new PropertyAddressChangedEvent(
        this.id.toValue(),
        oldAddress.toPrimitives(),
        address.toPrimitives(),
        changedAt,
      ),
    );
  }

  updateStatus(newStatus: PropertyStatus): void {
    if (!Object.values(PropertyStatus).includes(newStatus)) {
      throw new DomainException(
        `"${newStatus}" no es un estado de propiedad válido`,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    if (this._state.status === newStatus) {
      throw new DomainException(
        `La propiedad ya se encuentra en estado "${newStatus}"`,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const oldStatus = this._state.status;
    const changedAt = new Date();
    this._state.status = newStatus;
    this._state.updatedAt = changedAt;
    this.addDomainEvent(
      new PropertyStatusChangedEvent(this.id.toValue(), oldStatus, newStatus, changedAt),
    );
  }

  get internalCode(): string | null {
    return this._state.internalCode;
  }
  get address(): PropertyAddress {
    return this._state.address;
  }
  get propertyType(): PropertyType {
    return this._state.propertyType;
  }
  get status(): PropertyStatus {
    return this._state.status;
  }
  get features(): PropertyFeatures | null {
    return this._state.features;
  }
  get ownerProfileId(): string | null {
    return this._state.ownerProfileId;
  }
  get agentProfileId(): string | null {
    return this._state.agentProfileId;
  }
  get createdByUserId(): string | null {
    return this._state.createdByUserId;
  }
  get characteristics(): PropertyCharacteristicValue[] {
    return [...this._state.characteristics];
  }
  get createdAt(): Date {
    return this._state.createdAt;
  }
  get updatedAt(): Date {
    return this._state.updatedAt;
  }
  get deletedAt(): Date | null {
    return this._state.deletedAt;
  }

  toPrimitives(): Record<string, unknown> {
    return {
      id: this.id.toValue(),
      internalCode: this._state.internalCode,
      address: this._state.address,
      propertyType: this._state.propertyType,
      status: this._state.status,
      features: this._state.features,
      ownerProfileId: this._state.ownerProfileId,
      agentProfileId: this._state.agentProfileId,
      createdByUserId: this._state.createdByUserId,
      characteristics: this._state.characteristics.map((c) => c),
      createdAt: this._state.createdAt,
      updatedAt: this._state.updatedAt,
      deletedAt: this._state.deletedAt,
    };
  }
}
