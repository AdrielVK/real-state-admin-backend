import { ConservationState } from '../enums/conservation-state.enum';
import { PropertyFeatures } from '../value-objects/property-features.value-object';

const BASE_FEATURES = {
  totalAreaM2: 120,
  coveredAreaM2: 100,
  rooms: 4,
  bedrooms: 3,
  bathrooms: 2,
  garages: 1,
  floor: 5,
  conservationState: ConservationState.EXCELENTE,
  ageYears: 10,
};

describe('PropertyFeatures', () => {
  it('should build a valid feature set with all fields', () => {
    const features = new PropertyFeatures(BASE_FEATURES);

    expect(features.totalAreaM2).toBe(120);
    expect(features.coveredAreaM2).toBe(100);
    expect(features.rooms).toBe(4);
    expect(features.bedrooms).toBe(3);
    expect(features.bathrooms).toBe(2);
    expect(features.garages).toBe(1);
    expect(features.floor).toBe(5);
    expect(features.conservationState).toBe(ConservationState.EXCELENTE);
    expect(features.ageYears).toBe(10);
  });

  it('should treat optional numeric fields as nullable', () => {
    const features = new PropertyFeatures({
      ...BASE_FEATURES,
      floor: null,
      ageYears: null,
    });
    expect(features.floor).toBeNull();
    expect(features.ageYears).toBeNull();
  });

  it('should reject non-positive totalAreaM2', () => {
    expect(() => new PropertyFeatures({ ...BASE_FEATURES, totalAreaM2: 0 })).toThrow();
    expect(() => new PropertyFeatures({ ...BASE_FEATURES, totalAreaM2: -10 })).toThrow();
  });

  it('should reject negative counts (rooms, bedrooms, bathrooms, garages)', () => {
    expect(() => new PropertyFeatures({ ...BASE_FEATURES, rooms: -1 })).toThrow();
    expect(() => new PropertyFeatures({ ...BASE_FEATURES, bedrooms: -1 })).toThrow();
    expect(() => new PropertyFeatures({ ...BASE_FEATURES, bathrooms: -1 })).toThrow();
    expect(() => new PropertyFeatures({ ...BASE_FEATURES, garages: -1 })).toThrow();
  });

  it('should require a conservationState', () => {
    expect(
      () =>
        new PropertyFeatures({
          ...BASE_FEATURES,
          // @ts-expect-error verifying runtime guard
          conservationState: undefined,
        }),
    ).toThrow();
  });

  it('should NOT expose a propertyType field', () => {
    const features = new PropertyFeatures(BASE_FEATURES);
    expect((features as unknown as { propertyType?: unknown }).propertyType).toBeUndefined();
  });

  it('should be equal to another PropertyFeatures with the same values', () => {
    const a = new PropertyFeatures(BASE_FEATURES);
    const b = new PropertyFeatures(BASE_FEATURES);
    expect(a.equals(b)).toBe(true);
  });

  it('should NOT be equal when ageYears differs', () => {
    const a = new PropertyFeatures(BASE_FEATURES);
    const b = new PropertyFeatures({ ...BASE_FEATURES, ageYears: 1 });
    expect(a.equals(b)).toBe(false);
  });
});
