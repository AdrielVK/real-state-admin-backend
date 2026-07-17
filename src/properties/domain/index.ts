export type { PropertyCreateInput, PropertyReconstituteInput } from './entities/property.aggregate';
export { Property } from './entities/property.aggregate';
export { CharacteristicCategory } from './enums/characteristic-category.enum';
export { ConservationState } from './enums/conservation-state.enum';
export { PropertyStatus } from './enums/property-status.enum';
export { PropertyType } from './enums/property-type.enum';
export { PropertyAddressChangedEvent, PropertyCreatedEvent, PropertyDeletedEvent } from './events';
export type { IProfileExistenceService } from './ports/profile-existence.service';
export { IProfileExistenceServiceToken } from './ports/profile-existence.service';
export type {
  IPropertyRepository,
  PropertyCountFilters,
  PropertyPaginationFilters,
} from './repositories/property-repository.interface';
export { IPropertyRepositoryToken } from './repositories/property-repository.interface';
export {
  PropertyAddress,
  type PropertyAddressProps,
} from './value-objects/property-address.value-object';
export {
  type PropertyCharacteristicProps,
  PropertyCharacteristicValue,
} from './value-objects/property-characteristic.value-object';
export {
  type CreatePropertyFeaturesInput,
  PropertyFeatures,
  type PropertyFeaturesProps,
} from './value-objects/property-features.value-object';
export { PropertyId } from './value-objects/property-id.value-object';
