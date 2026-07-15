import { DomainException } from '@shared/domain';

import { Property } from '../entities/property.aggregate';
import { ConservationState } from '../enums/conservation-state.enum';
import { PropertyStatus } from '../enums/property-status.enum';
import { PropertyType } from '../enums/property-type.enum';
import { PropertyCreatedEvent } from '../events/property-created.event';
import { PropertyAddress } from '../value-objects/property-address.value-object';
import { PropertyFeatures } from '../value-objects/property-features.value-object';
import { PropertyId } from '../value-objects/property-id.value-object';
import { PropertyInternalId } from '../value-objects/property-internal-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeAddress(): PropertyAddress {
  return new PropertyAddress({
    placeId: 'place-123',
    formatted: 'Av. Corrientes 1234, CABA, Argentina',
    street: 'Av. Corrientes',
    streetNumber: '1234',
    floor: null,
    apartment: null,
    neighborhood: 'San Nicolás',
    city: 'CABA',
    province: 'Buenos Aires',
    country: 'Argentina',
    postalCode: 'C1043',
    latitude: -34.6037,
    longitude: -58.3816,
  });
}

function makeFeatures(): PropertyFeatures {
  return PropertyFeatures.create({
    propertyType: PropertyType.DEPARTAMENTO,
    conservationState: ConservationState.BUENO,
    bedrooms: 2,
    bathrooms: 1,
  });
}

describe('Property AggregateRoot', () => {
  describe('create()', () => {
    it('should create a Property with a generated UUID v4', () => {
      const property = Property.create(makeAddress(), makeFeatures());
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(property.id.toValue()).toMatch(uuidV4Regex);
    });

    it('should produce a different Property on each call', () => {
      const a = Property.create(makeAddress(), makeFeatures());
      const b = Property.create(makeAddress(), makeFeatures());
      expect(a.id.toValue()).not.toBe(b.id.toValue());
    });

    it('should default status to DISPONIBLE', () => {
      const property = Property.create(makeAddress(), makeFeatures());
      expect(property.status).toBe(PropertyStatus.DISPONIBLE);
    });

    it('should set createdAt and updatedAt to a Date', () => {
      const before = new Date();
      const property = Property.create(makeAddress(), makeFeatures());
      const after = new Date();
      expect(property.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(property.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(property.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(property.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should store the provided address and features', () => {
      const address = makeAddress();
      const features = makeFeatures();
      const property = Property.create(address, features);
      expect(property.address).toBe(address);
      expect(property.features).toBe(features);
    });

    it('should default internalId to null when not provided', () => {
      const property = Property.create(makeAddress(), makeFeatures());
      expect(property.internalId).toBeNull();
    });

    it('should accept an internalId when provided', () => {
      const internalId = PropertyInternalId.create('A1B2C3D');
      const property = Property.create(makeAddress(), makeFeatures(), internalId);
      expect(property.internalId).toBe(internalId);
      expect(property.internalId?.value).toBe('A1B2C3D');
    });

    it('should emit a single PropertyCreatedEvent with the new id', () => {
      const property = Property.create(makeAddress(), makeFeatures());
      const events = property.domainEvents;
      expect(events).toHaveLength(1);
      const event = events[0] as PropertyCreatedEvent;
      expect(event).toBeInstanceOf(PropertyCreatedEvent);
      expect(event.propertyId).toBe(property.id.toValue());
      expect(event.placeId).toBe('place-123');
      expect(event.status).toBe(PropertyStatus.DISPONIBLE);
      expect(event.eventName).toBe('properties.property.created');
    });
  });

  describe('reconstitute()', () => {
    it('should reconstitute a Property from persisted data with no events', () => {
      const id = new PropertyId(VALID_UUID);
      const address = makeAddress();
      const features = makeFeatures();
      const internalId = PropertyInternalId.create('A1B2C3D');
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const property = Property.reconstitute(
        id,
        address,
        features,
        internalId,
        PropertyStatus.BAJO_CONTRATO,
        createdAt,
        updatedAt,
      );

      expect(property).toBeInstanceOf(Property);
      expect(property.id).toBe(id);
      expect(property.address).toBe(address);
      expect(property.features).toBe(features);
      expect(property.internalId).toBe(internalId);
      expect(property.status).toBe(PropertyStatus.BAJO_CONTRATO);
      expect(property.createdAt).toBe(createdAt);
      expect(property.updatedAt).toBe(updatedAt);
      expect(property.domainEvents).toHaveLength(0);
    });

    it('should reject an invalid UUID at reconstitute time', () => {
      expect(() => {
        Property.reconstitute(
          new PropertyId('not-a-uuid'),
          makeAddress(),
          makeFeatures(),
          null,
          PropertyStatus.DISPONIBLE,
          new Date(),
          new Date(),
        );
      }).toThrow('El formato del UUID no es válido');
    });
  });

  describe('archive()', () => {
    it('should transition status from DISPONIBLE to ARCHIVADO', () => {
      const property = Property.create(makeAddress(), makeFeatures());
      property.archive();
      expect(property.status).toBe(PropertyStatus.ARCHIVADO);
    });

    it('should update the updatedAt timestamp', async () => {
      const property = Property.create(makeAddress(), makeFeatures());
      const original = property.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 5));
      property.archive();
      expect(property.updatedAt.getTime()).toBeGreaterThan(original.getTime());
    });

    it('should throw when status is not DISPONIBLE', () => {
      const property = Property.reconstitute(
        new PropertyId(VALID_UUID),
        makeAddress(),
        makeFeatures(),
        null,
        PropertyStatus.ARCHIVADO,
        new Date(),
        new Date(),
      );
      expect(() => {
        property.archive();
      }).toThrow(DomainException);
    });

    it('should throw when status is BAJO_CONTRATO', () => {
      const property = Property.reconstitute(
        new PropertyId(VALID_UUID),
        makeAddress(),
        makeFeatures(),
        null,
        PropertyStatus.BAJO_CONTRATO,
        new Date(),
        new Date(),
      );
      expect(() => {
        property.archive();
      }).toThrow(DomainException);
    });
  });

  describe('markUnderContract()', () => {
    it('should transition status from DISPONIBLE to BAJO_CONTRATO', () => {
      const property = Property.create(makeAddress(), makeFeatures());
      property.markUnderContract();
      expect(property.status).toBe(PropertyStatus.BAJO_CONTRATO);
    });

    it('should throw when status is ARCHIVADO', () => {
      const property = Property.reconstitute(
        new PropertyId(VALID_UUID),
        makeAddress(),
        makeFeatures(),
        null,
        PropertyStatus.ARCHIVADO,
        new Date(),
        new Date(),
      );
      expect(() => {
        property.markUnderContract();
      }).toThrow(DomainException);
    });

    it('should throw when status is BAJO_CONTRATO (no re-transition)', () => {
      const property = Property.reconstitute(
        new PropertyId(VALID_UUID),
        makeAddress(),
        makeFeatures(),
        null,
        PropertyStatus.BAJO_CONTRATO,
        new Date(),
        new Date(),
      );
      expect(() => {
        property.markUnderContract();
      }).toThrow(DomainException);
    });
  });

  describe('toPrimitives()', () => {
    it('should expose all fields including status, internalId, and features', () => {
      const property = Property.create(
        makeAddress(),
        makeFeatures(),
        PropertyInternalId.create('A1B2C3D'),
      );
      const primitives = property.toPrimitives();
      expect(primitives.id).toBe(property.id.toValue());
      expect(primitives.status).toBe(PropertyStatus.DISPONIBLE);
      expect(primitives.internalId).toBe('A1B2C3D');
      expect(primitives.address).toMatchObject({
        placeId: 'place-123',
        latitude: -34.6037,
        longitude: -58.3816,
      });
      expect(primitives.features).toMatchObject({
        propertyType: PropertyType.DEPARTAMENTO,
        bedrooms: 2,
        bathrooms: 1,
      });
      expect(primitives.createdAt).toBeInstanceOf(Date);
      expect(primitives.updatedAt).toBeInstanceOf(Date);
    });
  });
});
