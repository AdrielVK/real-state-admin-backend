import type { Property } from '../entities/property.aggregate';
import type { PropertyId } from '../value-objects/property-id.value-object';

export interface IPropertyRepository {
  findById(id: PropertyId): Promise<Property | null>;
  findByInternalCode(internalCode: string): Promise<Property | null>;
  save(property: Property): Promise<void>;
}

export const IPropertyRepositoryToken = Symbol('IPropertyRepository');
