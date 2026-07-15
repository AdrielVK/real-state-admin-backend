import { DomainException, ErrorCode } from '@shared/domain';

import { ConservationState } from '../enums/conservation-state.enum';
import { PropertyType } from '../enums/property-type.enum';
import { PropertyFeatures } from '../value-objects/property-features.value-object';

describe('PropertyFeatures', () => {
  it('should create features with only the required propertyType', () => {
    const features = PropertyFeatures.create({ propertyType: PropertyType.DEPARTAMENTO });
    expect(features.propertyType).toBe(PropertyType.DEPARTAMENTO);
    expect(features.conservationState).toBeNull();
    expect(features.totalAreaM2).toBeNull();
    expect(features.bedrooms).toBeNull();
    expect(features.bathrooms).toBeNull();
    expect(features.serviceTags).toEqual([]);
    expect(features.amenityTags).toEqual([]);
    expect(features.conditionTags).toEqual([]);
    expect(features.extraFeatures).toEqual({});
  });

  it('should create features with all optional fields populated', () => {
    const features = PropertyFeatures.create({
      propertyType: PropertyType.CASA,
      conservationState: ConservationState.BUENO,
      totalAreaM2: 120.5,
      coveredAreaM2: 100,
      uncoveredAreaM2: 20.5,
      frontMeters: 10,
      backMeters: 10,
      rooms: 4,
      bedrooms: 3,
      bathrooms: 2,
      toilettes: 1,
      garages: 1,
      floorNumber: 0,
      unitIdentifier: 'A',
      constructionYear: 2010,
      orientation: 'norte',
      serviceTags: ['gas_natural', 'agua_corriente'],
      amenityTags: ['pileta', 'parrilla'],
      conditionTags: ['recien_pintado'],
      extraFeatures: { has_pool: true },
    });
    expect(features.propertyType).toBe(PropertyType.CASA);
    expect(features.conservationState).toBe(ConservationState.BUENO);
    expect(features.totalAreaM2).toBe(120.5);
    expect(features.serviceTags).toEqual(['gas_natural', 'agua_corriente']);
    expect(features.amenityTags).toContain('pileta');
    expect(features.extraFeatures).toEqual({ has_pool: true });
  });

  it('should throw DomainException when propertyType is undefined', () => {
    expect(() => {
      PropertyFeatures.create({ propertyType: undefined as never });
    }).toThrow(DomainException);
    try {
      PropertyFeatures.create({ propertyType: undefined as never });
    } catch (error) {
      expect((error as DomainException).code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should expose frozen tag arrays (immutable)', () => {
    const features = PropertyFeatures.create({
      propertyType: PropertyType.DEPARTAMENTO,
      serviceTags: ['gas_natural'],
    });
    expect(() => {
      (features.serviceTags as string[]).push('agua_corriente');
    }).toThrow();
  });

  it('should expose frozen extraFeatures object (immutable)', () => {
    const features = PropertyFeatures.create({
      propertyType: PropertyType.DEPARTAMENTO,
      extraFeatures: { has_pool: true },
    });
    expect(() => {
      (features.extraFeatures as Record<string, unknown>).has_gym = true;
    }).toThrow();
  });
});
