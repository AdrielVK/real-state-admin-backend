import { DomainException, ErrorCode } from '@shared/domain';

import { PropertyAddress } from '../value-objects/property-address.value-object';

const validBaseProps = {
  placeId: 'place-123',
  formatted: 'Av. Corrientes 1234, CABA, Argentina',
  street: 'Av. Corrientes',
  streetNumber: '1234',
  floor: '5',
  apartment: 'A',
  neighborhood: 'San Nicolás',
  city: 'CABA',
  province: 'Buenos Aires',
  country: 'Argentina',
  postalCode: 'C1043',
  latitude: -34.6037,
  longitude: -58.3816,
};

describe('PropertyAddress', () => {
  it('should create an address with all valid fields', () => {
    const address = new PropertyAddress(validBaseProps);
    expect(address.placeId).toBe(validBaseProps.placeId);
    expect(address.formatted).toBe(validBaseProps.formatted);
    expect(address.street).toBe(validBaseProps.street);
    expect(address.latitude).toBe(validBaseProps.latitude);
    expect(address.longitude).toBe(validBaseProps.longitude);
  });

  it('should accept an address with only required fields', () => {
    const address = new PropertyAddress({
      placeId: 'place-456',
      formatted: 'Some address',
      street: null,
      streetNumber: null,
      floor: null,
      apartment: null,
      neighborhood: null,
      city: null,
      province: null,
      country: null,
      postalCode: null,
      latitude: 0,
      longitude: 0,
    });
    expect(address.placeId).toBe('place-456');
    expect(address.street).toBeNull();
    expect(address.latitude).toBe(0);
  });

  it('should throw DomainException when placeId is empty', () => {
    expect(() => {
      new PropertyAddress({ ...validBaseProps, placeId: '' });
    }).toThrow(DomainException);
  });

  it('should throw DomainException when formatted is empty', () => {
    expect(() => {
      new PropertyAddress({ ...validBaseProps, formatted: '' });
    }).toThrow(DomainException);
  });

  it('should throw DomainException for latitude > 90', () => {
    expect(() => {
      new PropertyAddress({ ...validBaseProps, latitude: 95 });
    }).toThrow(DomainException);
    try {
      new PropertyAddress({ ...validBaseProps, latitude: 95 });
    } catch (error) {
      expect((error as DomainException).code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should throw DomainException for latitude < -90', () => {
    expect(() => {
      new PropertyAddress({ ...validBaseProps, latitude: -95 });
    }).toThrow(DomainException);
  });

  it('should throw DomainException for longitude > 180', () => {
    expect(() => {
      new PropertyAddress({ ...validBaseProps, longitude: 200 });
    }).toThrow(DomainException);
  });

  it('should throw DomainException for longitude < -180', () => {
    expect(() => {
      new PropertyAddress({ ...validBaseProps, longitude: -200 });
    }).toThrow(DomainException);
  });

  describe('equals()', () => {
    it('should be equal to another address with the same placeId', () => {
      const a = new PropertyAddress(validBaseProps);
      const b = new PropertyAddress({ ...validBaseProps });
      expect(a.equals(b)).toBe(true);
    });

    it('should NOT be equal to an address with a different placeId', () => {
      const a = new PropertyAddress(validBaseProps);
      const b = new PropertyAddress({ ...validBaseProps, placeId: 'other-place' });
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      const a = new PropertyAddress(validBaseProps);
      expect(a.equals(null as never)).toBe(false);
      expect(a.equals(undefined as never)).toBe(false);
    });
  });
});
