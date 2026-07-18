import { AggregateRoot, DomainException, ErrorCode } from '@shared/domain';

import type { CharacteristicCategory } from '../enums/characteristic-category.enum';
import { PropertyStatus } from '../enums/property-status.enum';
import type { PropertyType } from '../enums/property-type.enum';
import { PropertyAddressChangedEvent } from '../events/property-address-changed.event';
import type { ChangedCharacteristic } from '../events/property-characteristics-updated.event';
import { PropertyCharacteristicsUpdatedEvent } from '../events/property-characteristics-updated.event';
import { PropertyCreatedEvent } from '../events/property-created.event';
import { PropertyDeletedEvent } from '../events/property-deleted.event';
import { PropertyFeaturesUpdatedEvent } from '../events/property-features-updated.event';
import { PropertyStatusChangedEvent } from '../events/property-status-changed.event';
import type { PropertyAddress } from '../value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../value-objects/property-characteristic.value-object';
import type { EditPropertyFeaturesInput } from '../value-objects/property-features.value-object';
import { PropertyFeatures } from '../value-objects/property-features.value-object';
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
   * Atomically apply a set of characteristic adds and removes in a single domain
   * operation. Validates invariants strictly (throws `DomainException` on
   * duplicates, missing remove targets, or add/remove overlap) and delegates
   * the actual state mutation to the existing silent `addCharacteristic()` /
   * `removeCharacteristic()` methods, which become no-ops once our guards have
   * already filtered the input.
   *
   * Emits `PropertyCharacteristicsUpdatedEvent` with the (slug, category) keys
   * of what was added and removed.
   */
  updateCharacteristics(
    toAdd: PropertyCharacteristicValue[],
    toRemove: readonly ChangedCharacteristic[],
  ): void {
    // 1) No duplicate add entries (same slug+category more than once).
    const addKeys = new Set<string>();
    for (const vo of toAdd) {
      const key = `${vo.slug}:${vo.category}`;
      if (addKeys.has(key)) {
        throw new DomainException(
          `No se permiten características duplicadas para agregar (slug "${vo.slug}", categoría "${vo.category}")`,
          ErrorCode.VALIDATION_ERROR,
        );
      }
      addKeys.add(key);
    }

    // 2) No overlap between add and remove for the same slug+category.
    for (const target of toRemove) {
      const key = `${target.slug}:${target.category}`;
      if (addKeys.has(key)) {
        throw new DomainException(
          `La característica "${target.slug}" (${target.category}) no puede estar en add y remove simultáneamente`,
          ErrorCode.VALIDATION_ERROR,
        );
      }
    }

    // 3) Every remove target must currently exist on the property.
    for (const target of toRemove) {
      const exists = this._state.characteristics.some(
        (c) => c.slug === target.slug && c.category === target.category,
      );
      if (!exists) {
        throw new DomainException(
          `No se puede eliminar la característica "${target.slug}" (${target.category}) porque no existe en la propiedad`,
          ErrorCode.VALIDATION_ERROR,
        );
      }
    }

    if (toAdd.length === 0 && toRemove.length === 0) {
      throw new DomainException(
        `No se edita ninguna caracteristica nueva`,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    // 4) Apply removals first, then additions. The existing methods are
    // idempotent (silent no-op on duplicate / missing), so this is safe even
    // if a guard above is later relaxed.
    for (const target of toRemove) {
      this.removeCharacteristic(target.slug, target.category);
    }
    for (const vo of toAdd) {
      this.addCharacteristic(vo);
    }

    const changedAt = new Date();
    this._state.updatedAt = changedAt;

    this.addDomainEvent(
      new PropertyCharacteristicsUpdatedEvent(
        this.id.toValue(),
        toAdd.map((vo) => ({ slug: vo.slug, category: vo.category })),
        toRemove.map((t) => ({ slug: t.slug, category: t.category })),
        changedAt,
      ),
    );
  }

  /**
   * After the repository has upserted each tag, the resolved numeric ids need
   * to be reflected back into the aggregate's VOs so the response shape
   * exposes them. Delegates to {@link PropertyCharacteristicValue.applyResolvedIds}.
   */
  syncCharacteristicIds(resolvedIds: number[]): void {
    this._state.characteristics = PropertyCharacteristicValue.applyResolvedIds(
      this._state.characteristics,
      resolvedIds,
    );
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

  /**
   * Atomically apply a partial update to the property's features. The merge
   * semantics distinguish `undefined` (field omitted → keep existing) from
   * `null` (field explicitly cleared → set to null) and from a concrete value
   * (field replaced). The first-creation path (current features is `null`)
   * requires the three mandatory fields (totalAreaM2, coveredAreaM2,
   * conservationState) to be provided — non-mandatory fields default to `null`.
   *
   * Emits `PropertyFeaturesUpdatedEvent` with the old snapshot (`null` on
   * first creation) and the new props snapshot. If the resulting features
   * are structurally equal to the current ones, the call is a no-op: no
   * event, no `updatedAt` bump.
   */
  updateFeatures(partial: EditPropertyFeaturesInput): void {
    const current = this._state.features;

    if (current === null) {
      // First-creation path: require mandatory fields to be present.
      if (partial.totalAreaM2 === undefined) {
        throw new DomainException(
          'El area total, en metros cuadrados, es obligatorio al crear las características',
          ErrorCode.VALIDATION_ERROR,
        );
      }
      if (partial.coveredAreaM2 === undefined) {
        throw new DomainException(
          'El area cubierta, en metros cuadrados, es obligatorio al crear las características',
          ErrorCode.VALIDATION_ERROR,
        );
      }
      if (partial.conservationState === undefined || partial.conservationState === null) {
        throw new DomainException(
          'El estado de conservacion es obligatorio al crear las características',
          ErrorCode.VALIDATION_ERROR,
        );
      }
    }

    const next = PropertyFeatures.merge(current, partial);

    // Equality guard: if no fields actually changed, no-op.
    if (current?.equals(next)) {
      return;
    }

    const oldSnapshot = current?.toPrimitives() ?? null;
    const newSnapshot = next.toPrimitives();
    const changedAt = new Date();
    this._state.features = next;
    this._state.updatedAt = changedAt;

    this.addDomainEvent(
      new PropertyFeaturesUpdatedEvent(this.id.toValue(), oldSnapshot, newSnapshot, changedAt),
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
