import { Inject, Injectable } from '@nestjs/common';

import { ErrorCode } from '@shared/domain';
import { AppException } from '@shared/presentation';

import {
  type IPlaceResolver,
  IPlaceResolverToken,
  type IPropertyInternalIdGenerator,
  IPropertyInternalIdGeneratorToken,
  type IPropertyRepository,
  IPropertyRepositoryToken,
  Property,
  PropertyAddress,
  PropertyFeatures,
  PropertyInternalId,
} from '../../domain';
import type { CreatePropertyDto, PropertyFeaturesDto } from '../dto/create-property.dto';

export interface CreatePropertyResult {
  id: string;
  placeId: string;
  status: string;
  internalId: string | null;
}

@Injectable()
export class CreatePropertyHandler {
  constructor(
    @Inject(IPlaceResolverToken) private readonly placeResolver: IPlaceResolver,
    @Inject(IPropertyInternalIdGeneratorToken)
    private readonly internalIdGenerator: IPropertyInternalIdGenerator,
    @Inject(IPropertyRepositoryToken) private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(dto: CreatePropertyDto): Promise<CreatePropertyResult> {
    const address = await this.resolveAddress(dto);
    const features = this.buildFeatures(dto.features);
    const internalId = this.resolveInternalId(dto.internalId);

    const property = Property.create(address, features, internalId);
    const saved = await this.propertyRepository.save(property);
    return {
      id: saved.id.toValue(),
      placeId: saved.address.placeId,
      status: saved.status,
      internalId: saved.internalId?.value ?? null,
    };
  }

  private async resolveAddress(dto: CreatePropertyDto): Promise<PropertyAddress> {
    const resolution = await this.placeResolver.resolveAddress(dto.address.placeId);
    return new PropertyAddress({
      placeId: resolution.placeId,
      formatted: resolution.formatted,
      street: resolution.street,
      streetNumber: resolution.streetNumber,
      floor: resolution.floor,
      apartment: resolution.apartment,
      neighborhood: resolution.neighborhood,
      city: resolution.city,
      province: resolution.province,
      country: resolution.country,
      postalCode: resolution.postalCode,
      latitude: resolution.latitude,
      longitude: resolution.longitude,
    });
  }

  // eslint-disable-next-line complexity -- declarative DTO → domain mapping
  private buildFeatures(dtoFeatures: PropertyFeaturesDto): PropertyFeatures {
    return PropertyFeatures.create({
      propertyType: dtoFeatures.propertyType,
      conservationState: dtoFeatures.conservationState ?? null,
      totalAreaM2: dtoFeatures.totalAreaM2 ?? null,
      coveredAreaM2: dtoFeatures.coveredAreaM2 ?? null,
      uncoveredAreaM2: dtoFeatures.uncoveredAreaM2 ?? null,
      frontMeters: dtoFeatures.frontMeters ?? null,
      backMeters: dtoFeatures.backMeters ?? null,
      rooms: dtoFeatures.rooms ?? null,
      bedrooms: dtoFeatures.bedrooms ?? null,
      bathrooms: dtoFeatures.bathrooms ?? null,
      toilettes: dtoFeatures.toilettes ?? null,
      garages: dtoFeatures.garages ?? null,
      floorNumber: dtoFeatures.floorNumber ?? null,
      unitIdentifier: dtoFeatures.unitIdentifier ?? null,
      constructionYear: dtoFeatures.constructionYear ?? null,
      orientation: dtoFeatures.orientation ?? null,
      serviceTags: dtoFeatures.serviceTags ?? [],
      amenityTags: dtoFeatures.amenityTags ?? [],
      conditionTags: dtoFeatures.conditionTags ?? [],
      extraFeatures: dtoFeatures.extraFeatures ?? {},
    });
  }

  private resolveInternalId(supplied: string | undefined): PropertyInternalId {
    if (!supplied) {
      return PropertyInternalId.create(this.internalIdGenerator.generate());
    }
    try {
      return PropertyInternalId.create(supplied);
    } catch {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'El internalId debe tener exactamente 7 caracteres alfanuméricos en mayúsculas',
      );
    }
  }
}
