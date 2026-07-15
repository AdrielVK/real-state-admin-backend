import type { Property } from '../entities/property.aggregate';
import type { PropertyId } from '../value-objects/property-id.value-object';
import type { PropertyInternalId } from '../value-objects/property-internal-id.value-object';

export interface IPropertyRepository {
  save(property: Property): Promise<Property>;
  findById(id: PropertyId): Promise<Property | null>;
  findByInternalId(internalId: PropertyInternalId): Promise<Property | null>;
}

export const IPropertyRepositoryToken = Symbol('IPropertyRepository');
