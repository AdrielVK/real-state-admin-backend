import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shared/infrastructure';

import { Property } from '../../domain/entities/property.aggregate';
import type {
  IPropertyRepository,
  PropertyCountFilters,
  PropertyPaginationFilters,
} from '../../domain/repositories/property-repository.interface';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { PrismaPropertyMapper } from '../mappers/prisma-property.mapper';

const PROPERTY_WITH_RELATIONS_INCLUDE = {
  features: true,
  tags: { include: { tag: true } },
} as const;

@Injectable()
export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: PropertyId): Promise<Property | null> {
    const row = await this.prisma.property.findFirst({
      where: { id: id.toValue(), deletedAt: null },
      include: PROPERTY_WITH_RELATIONS_INCLUDE,
    });
    return row ? PrismaPropertyMapper.toDomain(row) : null;
  }

  async findByInternalCode(internalCode: string): Promise<Property | null> {
    const row = await this.prisma.property.findFirst({
      where: { internalCode, deletedAt: null },
      include: PROPERTY_WITH_RELATIONS_INCLUDE,
    });
    return row ? PrismaPropertyMapper.toDomain(row) : null;
  }

  async findMany(filters: PropertyPaginationFilters): Promise<Property[]> {
    const { page, limit, createdByUserId } = filters;
    const where: { deletedAt: null; createdByUserId?: string } = { deletedAt: null };
    if (createdByUserId !== undefined) {
      where.createdByUserId = createdByUserId;
    }

    const rows = await this.prisma.property.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: PROPERTY_WITH_RELATIONS_INCLUDE,
    });
    return rows.map((row) => PrismaPropertyMapper.toDomain(row));
  }

  async count(filters: PropertyCountFilters): Promise<number> {
    const where: { deletedAt: null; createdByUserId?: string } = { deletedAt: null };
    if (filters.createdByUserId !== undefined) {
      where.createdByUserId = filters.createdByUserId;
    }
    return this.prisma.property.count({ where });
  }

  async save(property: Property): Promise<void> {
    const data = PrismaPropertyMapper.toPersistence(property);

    await this.prisma.$transaction(async (tx) => {
      const base = {
        internalCode: data.internalCode ?? null,
        status: data.status,
        propertyType: data.propertyType,
        ownerProfileId: data.ownerProfileId,
        agentProfileId: data.agentProfileId,
        createdByUserId: data.createdByUserId,
        addressPlaceId: data.addressPlaceId,
        addressFormatted: data.addressFormatted,
        addressStreet: data.addressStreet,
        addressStreetNumber: data.addressStreetNumber,
        addressNeighborhood: data.addressNeighborhood,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressCountry: data.addressCountry,
        addressPostalCode: data.addressPostalCode,
        addressLatitude: data.addressLatitude,
        addressLongitude: data.addressLongitude,
      };

      await tx.property.upsert({
        where: { id: data.id },
        create: { id: data.id, ...base },
        update: { ...base, deletedAt: data.deletedAt },
      });

      if (data.features) {
        await tx.propertyFeatures.upsert({
          where: { propertyId: data.id },
          create: { propertyId: data.id, ...data.features },
          update: data.features,
        });
      }

      // Upsert each characteristic by slug+category, collect resolved numeric ids
      const resolvedIds: number[] = [];
      for (const ch of data.characteristics) {
        const tag = await tx.propertyTag.upsert({
          where: { slug_category: { slug: ch.slug, category: ch.category as never } },
          create: { name: ch.name, slug: ch.slug, category: ch.category as never },
          update: {},
          select: { id: true },
        });
        resolvedIds.push(tag.id);
      }

      // Delete existing relations for this property
      await tx.propertyFeatureTag.deleteMany({
        where: { propertyId: data.id },
      });

      // Create new relations with the resolved numeric ids
      if (resolvedIds.length > 0) {
        await tx.propertyFeatureTag.createMany({
          data: resolvedIds.map((tagId) => ({ propertyId: data.id, tagId })),
        });
      }

      // Sync resolved numeric ids back into the aggregate's VOs
      property.syncCharacteristicIds(resolvedIds);
    });
  }
}
