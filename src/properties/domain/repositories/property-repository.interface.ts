import type { Property } from '../entities/property.aggregate';
import type { PropertyId } from '../value-objects/property-id.value-object';

export interface PropertyPaginationFilters {
  createdByUserId?: string;
  page: number;
  limit: number;
}

export interface PropertyCountFilters {
  createdByUserId?: string;
}

export interface IPropertyRepository {
  findById(id: PropertyId): Promise<Property | null>;
  findByInternalCode(internalCode: string): Promise<Property | null>;
  findMany(filters: PropertyPaginationFilters): Promise<Property[]>;
  count(filters: PropertyCountFilters): Promise<number>;
  save(property: Property): Promise<void>;
}

export const IPropertyRepositoryToken = Symbol('IPropertyRepository');
