import { PropertyAddress } from '../value-objects/property-address.value-object';

const VALID_FULL_ADDRESS = {
  addressPlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  addressFormatted: 'Av. Corrientes 1234, CABA, Argentina',
  addressStreet: 'Av. Corrientes',
  addressStreetNumber: '1234',
  addressNeighborhood: 'San Nicolás',
  addressCity: 'CABA',
  addressState: 'Buenos Aires',
  addressCountry: 'Argentina',
  addressPostalCode: 'C1043',
  addressLatitude: -34.6037,
  addressLongitude: -58.3816,
};

describe('PropertyAddress', () => {
  it('should build a valid address with all fields', () => {
    const address = new PropertyAddress(VALID_FULL_ADDRESS);

    expect(address.addressPlaceId).toBe(VALID_FULL_ADDRESS.addressPlaceId);
    expect(address.addressFormatted).toBe(VALID_FULL_ADDRESS.addressFormatted);
    expect(address.addressStreet).toBe(VALID_FULL_ADDRESS.addressStreet);
    expect(address.addressStreetNumber).toBe(VALID_FULL_ADDRESS.addressStreetNumber);
    expect(address.addressNeighborhood).toBe(VALID_FULL_ADDRESS.addressNeighborhood);
    expect(address.addressCity).toBe(VALID_FULL_ADDRESS.addressCity);
    expect(address.addressState).toBe(VALID_FULL_ADDRESS.addressState);
    expect(address.addressCountry).toBe(VALID_FULL_ADDRESS.addressCountry);
    expect(address.addressPostalCode).toBe(VALID_FULL_ADDRESS.addressPostalCode);
    expect(address.addressLatitude).toBe(VALID_FULL_ADDRESS.addressLatitude);
    expect(address.addressLongitude).toBe(VALID_FULL_ADDRESS.addressLongitude);
  });

  it('should require addressFormatted', () => {
    expect(
      () =>
        new PropertyAddress({
          ...VALID_FULL_ADDRESS,
          addressFormatted: '',
        }),
    ).toThrow();
  });

  it('should require addressCity', () => {
    expect(
      () =>
        new PropertyAddress({
          ...VALID_FULL_ADDRESS,
          addressCity: '',
        }),
    ).toThrow();
  });

  it('should require addressCountry', () => {
    expect(
      () =>
        new PropertyAddress({
          ...VALID_FULL_ADDRESS,
          addressCountry: '',
        }),
    ).toThrow();
  });

  it('should reject latitudes outside the valid range', () => {
    expect(() => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLatitude: 100 })).toThrow();
    expect(() => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLatitude: -100 })).toThrow();
  });

  it('should reject longitudes outside the valid range', () => {
    expect(() => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLongitude: 200 })).toThrow();
    expect(() => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLongitude: -200 })).toThrow();
  });

  it('should accept boundary latitude values', () => {
    expect(() => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLatitude: 90 })).not.toThrow();
    expect(
      () => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLatitude: -90 }),
    ).not.toThrow();
  });

  it('should accept boundary longitude values', () => {
    expect(
      () => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLongitude: 180 }),
    ).not.toThrow();
    expect(
      () => new PropertyAddress({ ...VALID_FULL_ADDRESS, addressLongitude: -180 }),
    ).not.toThrow();
  });

  it('should be equal to another PropertyAddress with the same values', () => {
    const a = new PropertyAddress(VALID_FULL_ADDRESS);
    const b = new PropertyAddress(VALID_FULL_ADDRESS);
    expect(a.equals(b)).toBe(true);
  });

  it('should NOT be equal to another PropertyAddress with different formatted', () => {
    const a = new PropertyAddress(VALID_FULL_ADDRESS);
    const b = new PropertyAddress({ ...VALID_FULL_ADDRESS, addressFormatted: 'Other 999' });
    expect(a.equals(b)).toBe(false);
  });
});
