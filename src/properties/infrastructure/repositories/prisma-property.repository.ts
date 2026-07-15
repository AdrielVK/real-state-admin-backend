import { Injectable } from '@nestjs/common';

import { DomainException, ErrorCode } from '@shared/domain';
import { PrismaService } from '@shared/infrastructure';

import { Property } from '../../domain/entities/property.aggregate';
import type { IPropertyRepository } from '../../domain/ports/property-repository.interface';
import type { PropertyId } from '../../domain/value-objects/property-id.value-object';
import type { PropertyInternalId } from '../../domain/value-objects/property-internal-id.value-object';
import { PrismaPropertyMapper } from '../mappers/prisma-property.mapper';

@Injectable()
export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: PropertyId): Promise<Property | null> {
    const prismaProperty = await this.prisma.property.findUnique({
      where: { id: id.toValue() },
      include: { features: true },
    });
    if (!prismaProperty) {
      return null;
    }
    return PrismaPropertyMapper.toDomain(prismaProperty, prismaProperty.features);
  }

  async findByInternalId(internalId: PropertyInternalId): Promise<Property | null> {
    const prismaProperty = await this.prisma.property.findUnique({
      where: { internalId: internalId.value },
      include: { features: true },
    });
    if (!prismaProperty) {
      return null;
    }
    return PrismaPropertyMapper.toDomain(prismaProperty, prismaProperty.features);
  }

  async save(property: Property): Promise<Property> {
    const { property: propertyData, features: featuresData } =
      PrismaPropertyMapper.toPrisma(property);

    try {
      await this.prisma.property.upsert({
        where: { id: propertyData.id },
        create: {
          id: propertyData.id,
          internalId: propertyData.internalId,
          status: propertyData.status,
          placeId: propertyData.placeId,
          formatted: propertyData.formatted,
          street: propertyData.street,
          streetNumber: propertyData.streetNumber,
          floor: propertyData.floor,
          apartment: propertyData.apartment,
          neighborhood: propertyData.neighborhood,
          city: propertyData.city,
          province: propertyData.province,
          country: propertyData.country,
          postalCode: propertyData.postalCode,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          createdAt: propertyData.createdAt,
          updatedAt: propertyData.updatedAt,
          features: {
            create: {
              propertyType: featuresData.propertyType,
              conservationState: featuresData.conservationState,
              totalAreaM2: featuresData.totalAreaM2,
              coveredAreaM2: featuresData.coveredAreaM2,
              uncoveredAreaM2: featuresData.uncoveredAreaM2,
              frontMeters: featuresData.frontMeters,
              backMeters: featuresData.backMeters,
              rooms: featuresData.rooms,
              bedrooms: featuresData.bedrooms,
              bathrooms: featuresData.bathrooms,
              toilettes: featuresData.toilettes,
              garages: featuresData.garages,
              floorNumber: featuresData.floorNumber,
              unitIdentifier: featuresData.unitIdentifier,
              constructionYear: featuresData.constructionYear,
              orientation: featuresData.orientation,
              serviceTags: featuresData.serviceTags,
              amenityTags: featuresData.amenityTags,
              conditionTags: featuresData.conditionTags,
              extraFeatures: featuresData.extraFeatures,
            },
          },
        },
        update: {
          internalId: propertyData.internalId,
          status: propertyData.status,
          placeId: propertyData.placeId,
          formatted: propertyData.formatted,
          street: propertyData.street,
          streetNumber: propertyData.streetNumber,
          floor: propertyData.floor,
          apartment: propertyData.apartment,
          neighborhood: propertyData.neighborhood,
          city: propertyData.city,
          province: propertyData.province,
          country: propertyData.country,
          postalCode: propertyData.postalCode,
          latitude: propertyData.latitude,
          longitude: propertyData.longitude,
          updatedAt: propertyData.updatedAt,
          features: {
            upsert: {
              create: {
                propertyType: featuresData.propertyType,
                conservationState: featuresData.conservationState,
                totalAreaM2: featuresData.totalAreaM2,
                coveredAreaM2: featuresData.coveredAreaM2,
                uncoveredAreaM2: featuresData.uncoveredAreaM2,
                frontMeters: featuresData.frontMeters,
                backMeters: featuresData.backMeters,
                rooms: featuresData.rooms,
                bedrooms: featuresData.bedrooms,
                bathrooms: featuresData.bathrooms,
                toilettes: featuresData.toilettes,
                garages: featuresData.garages,
                floorNumber: featuresData.floorNumber,
                unitIdentifier: featuresData.unitIdentifier,
                constructionYear: featuresData.constructionYear,
                orientation: featuresData.orientation,
                serviceTags: featuresData.serviceTags,
                amenityTags: featuresData.amenityTags,
                conditionTags: featuresData.conditionTags,
                extraFeatures: featuresData.extraFeatures,
              },
              update: {
                propertyType: featuresData.propertyType,
                conservationState: featuresData.conservationState,
                totalAreaM2: featuresData.totalAreaM2,
                coveredAreaM2: featuresData.coveredAreaM2,
                uncoveredAreaM2: featuresData.uncoveredAreaM2,
                frontMeters: featuresData.frontMeters,
                backMeters: featuresData.backMeters,
                rooms: featuresData.rooms,
                bedrooms: featuresData.bedrooms,
                bathrooms: featuresData.bathrooms,
                toilettes: featuresData.toilettes,
                garages: featuresData.garages,
                floorNumber: featuresData.floorNumber,
                unitIdentifier: featuresData.unitIdentifier,
                constructionYear: featuresData.constructionYear,
                orientation: featuresData.orientation,
                serviceTags: featuresData.serviceTags,
                amenityTags: featuresData.amenityTags,
                conditionTags: featuresData.conditionTags,
                extraFeatures: featuresData.extraFeatures,
              },
            },
          },
        },
      });
    } catch (error) {
      const { message } = error as Error;
      if (message.includes('Unique constraint') && message.includes('internal_id')) {
        throw new DomainException(
          'Ya existe una propiedad con ese internalId',
          ErrorCode.DUPLICATE_INTERNAL_ID,
        );
      }
      throw error;
    }

    property.pullDomainEvents();
    return property;
  }
}
