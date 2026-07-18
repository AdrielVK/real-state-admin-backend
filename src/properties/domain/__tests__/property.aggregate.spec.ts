import { DomainException } from '@shared/domain';

import { Property } from '../entities/property.aggregate';
import { CharacteristicCategory } from '../enums/characteristic-category.enum';
import { ConservationState } from '../enums/conservation-state.enum';
import { PropertyStatus } from '../enums/property-status.enum';
import { PropertyType } from '../enums/property-type.enum';
import { PropertyAddress } from '../value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../value-objects/property-characteristic.value-object';
import { PropertyFeatures } from '../value-objects/property-features.value-object';
import { PropertyId } from '../value-objects/property-id.value-object';

function makeValidAddress(): PropertyAddress {
  return new PropertyAddress({
    addressPlaceId: 'place-1',
    addressFormatted: 'Av. Corrientes 1234',
    addressStreet: 'Av. Corrientes',
    addressStreetNumber: '1234',
    addressNeighborhood: 'San Nicolás',
    addressCity: 'CABA',
    addressState: 'Buenos Aires',
    addressCountry: 'Argentina',
    addressPostalCode: 'C1043',
    addressLatitude: -34.6037,
    addressLongitude: -58.3816,
  });
}

function makeValidFeatures(): PropertyFeatures {
  return new PropertyFeatures({
    totalAreaM2: 120,
    coveredAreaM2: 100,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    floor: 5,
    conservationState: ConservationState.EXCELENTE,
    ageYears: 10,
  });
}

function makeCharacteristic(
  id: number | null,
  slug: string,
  category: CharacteristicCategory = CharacteristicCategory.AMENIDAD,
): PropertyCharacteristicValue {
  return id === null
    ? PropertyCharacteristicValue.fromCreate(slug, slug, category)
    : PropertyCharacteristicValue.fromPersistence(id, slug, slug, category);
}

describe('Property aggregate', () => {
  describe('create()', () => {
    it('should build a property with all required fields and emit a PropertyCreated event', () => {
      const address = makeValidAddress();
      const features = makeValidFeatures();

      const property = Property.create({
        internalCode: 'PROP-001',
        address,
        propertyType: PropertyType.DEPARTAMENTO,
        status: PropertyStatus.DISPONIBLE,
        features,
        createdByUserId: 'user-uuid-evt',
      });

      expect(property).toBeInstanceOf(Property);
      const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(property.id.toValue()).toMatch(uuidV4);
      expect(property.internalCode).toBe('PROP-001');
      expect(property.address).toBe(address);
      expect(property.propertyType).toBe(PropertyType.DEPARTAMENTO);
      expect(property.status).toBe(PropertyStatus.DISPONIBLE);
      expect(property.features).toBe(features);
      expect(property.characteristics).toEqual([]);
      expect(property.ownerProfileId).toBeNull();
      expect(property.agentProfileId).toBeNull();
      expect(property.createdByUserId).toBe('user-uuid-evt');
      expect(property.deletedAt).toBeNull();
      expect(property.domainEvents).toHaveLength(1);
      expect(property.domainEvents[0]).toMatchObject({
        eventName: 'property.created',
        internalCode: 'PROP-001',
        propertyId: property.id.toValue(),
        createdByUserId: 'user-uuid-evt',
      });
    });

    it('should default status to DISPONIBLE when not provided', () => {
      const property = Property.create({
        internalCode: 'PROP-002',
        address: makeValidAddress(),
        propertyType: PropertyType.CASA,
        features: makeValidFeatures(),
      });

      expect(property.status).toBe(PropertyStatus.DISPONIBLE);
    });

    it('should accept ownerProfileId and agentProfileId', () => {
      const property = Property.create({
        internalCode: 'PROP-003',
        address: makeValidAddress(),
        propertyType: PropertyType.DEPARTAMENTO,
        status: PropertyStatus.DISPONIBLE,
        features: makeValidFeatures(),
        ownerProfileId: 'owner-1',
        agentProfileId: 'agent-1',
      });

      expect(property.ownerProfileId).toBe('owner-1');
      expect(property.agentProfileId).toBe('agent-1');
    });

    it('should store createdByUserId when provided and expose it via getter', () => {
      const property = Property.create({
        internalCode: 'PROP-AUDIT-001',
        address: makeValidAddress(),
        propertyType: PropertyType.DEPARTAMENTO,
        features: makeValidFeatures(),
        createdByUserId: 'user-uuid-1',
      });

      expect(property.createdByUserId).toBe('user-uuid-1');
    });

    it('should reject empty internalCode', () => {
      expect(() =>
        Property.create({
          internalCode: '',
          address: makeValidAddress(),
          propertyType: PropertyType.CASA,
          features: makeValidFeatures(),
        }),
      ).toThrow(DomainException);
    });

    it('should require a propertyType', () => {
      expect(() =>
        Property.create({
          internalCode: 'PROP-004',
          address: makeValidAddress(),
          // @ts-expect-error verifying runtime guard
          propertyType: undefined,
          features: makeValidFeatures(),
        }),
      ).toThrow(DomainException);
    });
  });

  describe('reconstitute()', () => {
    it('should rebuild a property from persistence with no events', () => {
      const id = PropertyId.generate();
      const address = makeValidAddress();
      const features = makeValidFeatures();
      const characteristic = makeCharacteristic(1, 'piscina');
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const deletedAt = new Date('2024-06-01');

      const property = Property.reconstitute({
        id,
        internalCode: 'PROP-005',
        address,
        propertyType: PropertyType.DEPARTAMENTO,
        status: PropertyStatus.NO_DISPONIBLE,
        features,
        ownerProfileId: 'owner-1',
        agentProfileId: null,
        characteristics: [characteristic],
        createdByUserId: 'user-uuid-recon',
        createdAt,
        updatedAt,
        deletedAt,
      });

      expect(property.id).toBe(id);
      expect(property.internalCode).toBe('PROP-005');
      expect(property.status).toBe(PropertyStatus.NO_DISPONIBLE);
      expect(property.ownerProfileId).toBe('owner-1');
      expect(property.agentProfileId).toBeNull();
      expect(property.characteristics).toHaveLength(1);
      expect(property.characteristics[0]).toBe(characteristic);
      expect(property.deletedAt).toBe(deletedAt);
      expect(property.createdByUserId).toBe('user-uuid-recon');
      expect(property.domainEvents).toHaveLength(0);
    });

    it('should reconstitute with null createdByUserId (legacy rows)', () => {
      const id = PropertyId.generate();
      const property = Property.reconstitute({
        id,
        internalCode: 'PROP-LEGACY',
        address: makeValidAddress(),
        propertyType: PropertyType.CASA,
        status: PropertyStatus.DISPONIBLE,
        features: null,
        ownerProfileId: null,
        agentProfileId: null,
        characteristics: [],
        createdByUserId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        deletedAt: null,
      });

      expect(property.createdByUserId).toBeNull();
    });
  });

  describe('characteristic management', () => {
    function makeProperty(): Property {
      return Property.create({
        internalCode: 'PROP-006',
        address: makeValidAddress(),
        propertyType: PropertyType.DEPARTAMENTO,
        features: makeValidFeatures(),
      });
    }

    it('should add a characteristic and expose it via getCharacteristics', () => {
      const property = makeProperty();
      const characteristic = makeCharacteristic(1, 'piscina');

      property.addCharacteristic(characteristic);

      expect(property.characteristics).toHaveLength(1);
      expect(property.characteristics[0]).toBe(characteristic);
    });

    it('should not duplicate an existing characteristic by slug+category', () => {
      const property = makeProperty();
      // Two VOs with same slug+category but different ids — should still dedup
      const a = makeCharacteristic(1, 'piscina');
      const b = makeCharacteristic(2, 'piscina');

      property.addCharacteristic(a);
      property.addCharacteristic(b);

      expect(property.characteristics).toHaveLength(1);
      expect(property.characteristics[0]).toBe(a);
    });

    it('should treat the same slug in different categories as distinct', () => {
      const property = makeProperty();
      const a = makeCharacteristic(1, 'piscina', CharacteristicCategory.AMENIDAD);
      const b = makeCharacteristic(2, 'piscina', CharacteristicCategory.SERVICIO);

      property.addCharacteristic(a);
      property.addCharacteristic(b);

      expect(property.characteristics).toHaveLength(2);
    });

    it('should remove a characteristic by slug+category', () => {
      const property = makeProperty();
      property.addCharacteristic(makeCharacteristic(1, 'piscina'));
      property.addCharacteristic(makeCharacteristic(2, 'gimnasio'));

      property.removeCharacteristic('piscina', CharacteristicCategory.AMENIDAD);

      expect(property.characteristics).toHaveLength(1);
      expect(property.characteristics[0]!.slug).toBe('gimnasio');
    });

    it('should be a no-op when removing a non-existent characteristic', () => {
      const property = makeProperty();
      property.addCharacteristic(makeCharacteristic(1, 'piscina'));

      property.removeCharacteristic('missing', CharacteristicCategory.AMENIDAD);

      expect(property.characteristics).toHaveLength(1);
    });

    it('should sync resolved numeric ids back into the VOs', () => {
      const property = makeProperty();
      property.addCharacteristic(makeCharacteristic(null, 'piscina'));
      property.addCharacteristic(makeCharacteristic(null, 'gimnasio'));

      expect(property.characteristics[0]!.id).toBeNull();
      expect(property.characteristics[1]!.id).toBeNull();

      property.syncCharacteristicIds([101, 202]);

      expect(property.characteristics[0]!.id).toBe(101);
      expect(property.characteristics[1]!.id).toBe(202);
      expect(property.characteristics[0]!.slug).toBe('piscina');
      expect(property.characteristics[0]!.name).toBe('piscina');
    });

    it('should not crash when syncCharacteristicIds receives fewer ids than characteristics', () => {
      const property = makeProperty();
      property.addCharacteristic(makeCharacteristic(null, 'piscina'));
      property.addCharacteristic(makeCharacteristic(null, 'gimnasio'));

      property.syncCharacteristicIds([101]);

      expect(property.characteristics[0]!.id).toBe(101);
      expect(property.characteristics[1]!.id).toBeNull();
    });
  });

  describe('softDelete()', () => {
    function makePropertyForDelete(): Property {
      return Property.create({
        internalCode: 'PROP-DEL',
        address: makeValidAddress(),
        propertyType: PropertyType.DEPARTAMENTO,
        features: makeValidFeatures(),
      });
    }

    it('should set deletedAt and emit a PropertyDeletedEvent', () => {
      const property = makePropertyForDelete();

      property.softDelete();

      expect(property.deletedAt).not.toBeNull();
      expect(property.domainEvents).toHaveLength(2); // created + deleted
      expect(property.domainEvents[1]!.eventName).toBe('property.deleted');
    });

    it('should be idempotent — second call does nothing', () => {
      const property = makePropertyForDelete();
      property.softDelete();
      const firstDeletedAt = property.deletedAt;
      const eventsAfterFirst = property.domainEvents.length;

      property.softDelete();

      expect(property.deletedAt).toBe(firstDeletedAt);
      expect(property.domainEvents).toHaveLength(eventsAfterFirst);
    });
  });

  describe('updateAddress()', () => {
    function makePropertyForAddressUpdate(): Property {
      return Property.create({
        internalCode: 'PROP-ADDR',
        address: makeValidAddress(),
        propertyType: PropertyType.DEPARTAMENTO,
        features: makeValidFeatures(),
      });
    }

    function makeDifferentAddress(): PropertyAddress {
      return new PropertyAddress({
        addressPlaceId: 'place-2',
        addressFormatted: 'Av. Santa Fe 2500',
        addressStreet: 'Av. Santa Fe',
        addressStreetNumber: '2500',
        addressNeighborhood: 'Palermo',
        addressCity: 'CABA',
        addressState: 'Buenos Aires',
        addressCountry: 'Argentina',
        addressPostalCode: 'C1425',
        addressLatitude: -34.595,
        addressLongitude: -58.397,
      });
    }

    it('should replace the address, bump updatedAt, and emit PropertyAddressChangedEvent with old/new snapshots', async () => {
      const property = makePropertyForAddressUpdate();
      const originalAddress = property.address;
      const newAddress = makeDifferentAddress();
      const createdEventCount = property.domainEvents.length;
      const originalUpdatedAt = property.updatedAt;

      // Tiny delay so updatedAt is observably later than the original timestamp.
      await new Promise((resolve) => setTimeout(resolve, 5));

      property.updateAddress(newAddress);

      // Address is replaced
      expect(property.address).toBe(newAddress);
      expect(property.address).not.toBe(originalAddress);

      // updatedAt is advanced
      expect(property.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      // Event was emitted with old and new snapshots
      const events = property.domainEvents;
      expect(events).toHaveLength(createdEventCount + 1);
      const lastEvent = events.at(-1)!;
      expect(lastEvent.eventName).toBe('property.address-changed');
      expect(lastEvent).toMatchObject({
        propertyId: property.id.toValue(),
      });
      // Snapshots expose all the address fields from the VO
      const newAddressEvent = lastEvent as unknown as {
        newAddress: ReturnType<PropertyAddress['toPrimitives']>;
        oldAddress: ReturnType<PropertyAddress['toPrimitives']>;
      };
      expect(newAddressEvent.oldAddress).toEqual(originalAddress.toPrimitives());
      expect(newAddressEvent.newAddress).toEqual(newAddress.toPrimitives());
      expect(newAddressEvent.oldAddress.addressFormatted).toBe('Av. Corrientes 1234');
      expect(newAddressEvent.newAddress.addressFormatted).toBe('Av. Santa Fe 2500');
    });

    it('should be a no-op when the new address equals the current one (idempotent)', () => {
      const property = makePropertyForAddressUpdate();
      // Build an address that is structurally equal to the one created by the aggregate.
      const equalAddress = new PropertyAddress({
        addressPlaceId: 'place-1',
        addressFormatted: 'Av. Corrientes 1234',
        addressStreet: 'Av. Corrientes',
        addressStreetNumber: '1234',
        addressNeighborhood: 'San Nicolás',
        addressCity: 'CABA',
        addressState: 'Buenos Aires',
        addressCountry: 'Argentina',
        addressPostalCode: 'C1043',
        addressLatitude: -34.6037,
        addressLongitude: -58.3816,
      });
      expect(equalAddress.equals(property.address)).toBe(true);

      const eventsBefore = property.domainEvents.length;
      const updatedAtBefore = property.updatedAt;
      const addressBefore = property.address;

      property.updateAddress(equalAddress);

      // No change to address, updatedAt, or events
      expect(property.address).toBe(addressBefore);
      expect(property.updatedAt).toBe(updatedAtBefore);
      expect(property.domainEvents).toHaveLength(eventsBefore);
    });
  });

  describe('updateStatus()', () => {
    function makePropertyForStatusUpdate(): Property {
      return Property.create({
        internalCode: 'PROP-STATUS',
        address: makeValidAddress(),
        propertyType: PropertyType.DEPARTAMENTO,
        features: makeValidFeatures(),
      });
    }

    it('should replace the status, bump updatedAt, and emit PropertyStatusChangedEvent with old/new snapshots', async () => {
      const property = makePropertyForStatusUpdate();
      const originalStatus = property.status;
      const createdEventCount = property.domainEvents.length;
      const originalUpdatedAt = property.updatedAt;

      // Tiny delay so updatedAt is observably later than the original timestamp.
      await new Promise((resolve) => setTimeout(resolve, 5));

      property.updateStatus(PropertyStatus.VENDIDA);

      // Status is replaced
      expect(property.status).toBe(PropertyStatus.VENDIDA);
      expect(property.status).not.toBe(originalStatus);

      // updatedAt is advanced
      expect(property.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());

      // Event was emitted with old and new snapshots
      const events = property.domainEvents;
      expect(events).toHaveLength(createdEventCount + 1);
      const lastEvent = events.at(-1)!;
      expect(lastEvent.eventName).toBe('property.status-changed');
      expect(lastEvent).toMatchObject({
        propertyId: property.id.toValue(),
        oldStatus: PropertyStatus.DISPONIBLE,
        newStatus: PropertyStatus.VENDIDA,
      });
      expect((lastEvent as { changedAt: Date }).changedAt).toBeInstanceOf(Date);
    });

    it('should throw a DomainException when the new status equals the current one', () => {
      const property = makePropertyForStatusUpdate();
      expect(property.status).toBe(PropertyStatus.DISPONIBLE);

      expect(() => {
        property.updateStatus(PropertyStatus.DISPONIBLE);
      }).toThrow(DomainException);
    });

    it('should throw a DomainException when the status value is not a valid PropertyStatus', () => {
      const property = makePropertyForStatusUpdate();

      expect(() => {
        property.updateStatus('estado_imposible' as PropertyStatus);
      }).toThrow(DomainException);
    });

    it('should emit PropertyStatusChangedEvent carrying propertyId, oldStatus, newStatus, and changedAt', () => {
      const property = Property.reconstitute({
        id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
        internalCode: 'PROP-STATUS-PAYLOAD',
        address: makeValidAddress(),
        propertyType: PropertyType.DEPARTAMENTO,
        status: PropertyStatus.RESERVADA,
        features: null,
        ownerProfileId: null,
        agentProfileId: null,
        characteristics: [],
        createdByUserId: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        deletedAt: null,
      });

      property.updateStatus(PropertyStatus.ALQUILADA);

      const lastEvent = property.domainEvents.at(-1)! as {
        eventName: string;
        propertyId: string;
        oldStatus: PropertyStatus;
        newStatus: PropertyStatus;
        changedAt: Date;
      };
      expect(lastEvent.eventName).toBe('property.status-changed');
      expect(lastEvent.propertyId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(lastEvent.oldStatus).toBe(PropertyStatus.RESERVADA);
      expect(lastEvent.newStatus).toBe(PropertyStatus.ALQUILADA);
      expect(lastEvent.changedAt).toBeInstanceOf(Date);
      expect(property.status).toBe(PropertyStatus.ALQUILADA);
    });
  });

  describe('toPrimitives()', () => {
    it('should expose all aggregate fields', () => {
      const address = makeValidAddress();
      const features = makeValidFeatures();
      const property = Property.create({
        internalCode: 'PROP-007',
        address,
        propertyType: PropertyType.DEPARTAMENTO,
        features,
        ownerProfileId: 'owner-1',
        agentProfileId: 'agent-1',
        createdByUserId: 'user-uuid-prim',
      });
      property.addCharacteristic(makeCharacteristic(1, 'piscina'));

      const primitives = property.toPrimitives();

      expect(primitives.id).toBe(property.id.toValue());
      expect(primitives.internalCode).toBe('PROP-007');
      expect(primitives.address).toBe(address);
      expect(primitives.propertyType).toBe(PropertyType.DEPARTAMENTO);
      expect(primitives.status).toBe(PropertyStatus.DISPONIBLE);
      expect(primitives.features).toBe(features);
      expect(primitives.ownerProfileId).toBe('owner-1');
      expect(primitives.agentProfileId).toBe('agent-1');
      expect(primitives.createdByUserId).toBe('user-uuid-prim');
      expect((primitives.characteristics as PropertyCharacteristicValue[])[0]?.id).toBe(1);
      expect(primitives.deletedAt).toBeNull();
    });
  });
});
