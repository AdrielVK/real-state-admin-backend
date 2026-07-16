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
      expect(property.deletedAt).toBeNull();
      expect(property.domainEvents).toHaveLength(1);
      expect(property.domainEvents[0]).toMatchObject({
        eventName: 'property.created',
        internalCode: 'PROP-001',
        propertyId: property.id.toValue(),
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
      expect(property.domainEvents).toHaveLength(0);
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
      expect((primitives.characteristics as PropertyCharacteristicValue[])[0]?.id).toBe(1);
      expect(primitives.deletedAt).toBeNull();
    });
  });
});
