import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { UserRole } from '@shared/domain';
import { Roles } from '@shared/presentation';

import {
  CreatePropertyCommand,
  CreatePropertyUseCase,
} from '../../application/commands/create-property.use-case';
import {
  DeletePropertyCommand,
  DeletePropertyUseCase,
} from '../../application/commands/delete-property.use-case';
import { CreatePropertyDto } from '../../application/dto/create-property.dto';
import {
  GetPropertyByIdQuery,
  GetPropertyByIdUseCase,
} from '../../application/queries/get-property-by-id.use-case';
import type { Property, PropertyCharacteristicValue } from '../../domain';

export interface PropertyCharacteristicResponse {
  id: number;
  name: string;
  slug: string;
  category: string;
}

export interface PropertyAddressResponse {
  placeId: string | null;
  formatted: string;
  street: string | null;
  streetNumber: string | null;
  neighborhood: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PropertyFeaturesResponse {
  totalAreaM2: number;
  coveredAreaM2: number;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  floor: number | null;
  conservationState: string | null;
  ageYears: number | null;
}

export interface PropertyResponse {
  id: string;
  internalCode: string | null;
  status: string;
  propertyType: string;
  ownerProfileId: string | null;
  agentProfileId: string | null;
  address: PropertyAddressResponse;
  features: PropertyFeaturesResponse | null;
  characteristics: PropertyCharacteristicResponse[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function mapCharacteristic(
  characteristic: PropertyCharacteristicValue,
): PropertyCharacteristicResponse {
  // By the time the controller serializes the response, the repository has resolved
  // every characteristic's numeric id via syncCharacteristicIds() — a null id would
  // indicate a broken invariant in the create path.
  if (characteristic.id === null) {
    throw new Error(
      `Characteristic "${characteristic.slug}" (${characteristic.category}) has no resolved id — the repository must run syncCharacteristicIds() before serialization.`,
    );
  }
  return {
    id: characteristic.id,
    name: characteristic.name,
    slug: characteristic.slug,
    category: characteristic.category,
  };
}

function mapProperty(property: Property): PropertyResponse {
  return {
    id: property.id.toValue(),
    internalCode: property.internalCode,
    status: property.status,
    propertyType: property.propertyType,
    ownerProfileId: property.ownerProfileId,
    agentProfileId: property.agentProfileId,
    address: {
      placeId: property.address.addressPlaceId,
      formatted: property.address.addressFormatted,
      street: property.address.addressStreet,
      streetNumber: property.address.addressStreetNumber,
      neighborhood: property.address.addressNeighborhood,
      city: property.address.addressCity,
      state: property.address.addressState,
      country: property.address.addressCountry,
      postalCode: property.address.addressPostalCode,
      latitude: property.address.addressLatitude,
      longitude: property.address.addressLongitude,
    },
    features: property.features
      ? {
          totalAreaM2: property.features.totalAreaM2,
          coveredAreaM2: property.features.coveredAreaM2,
          rooms: property.features.rooms,
          bedrooms: property.features.bedrooms,
          bathrooms: property.features.bathrooms,
          garages: property.features.garages,
          floor: property.features.floor,
          conservationState: property.features.conservationState,
          ageYears: property.features.ageYears,
        }
      : null,
    characteristics: property.characteristics.map((c) => mapCharacteristic(c)),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    deletedAt: property.deletedAt?.toISOString() ?? null,
  };
}

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly getPropertyByIdUseCase: GetPropertyByIdUseCase,
    private readonly deletePropertyUseCase: DeletePropertyUseCase,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.ADMINISTRATIVE)
  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: CreatePropertyDto,
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.createPropertyUseCase.execute(new CreatePropertyCommand(dto));
    return { message: 'Propiedad creada con éxito', data: mapProperty(property) };
  }

  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.ADMINISTRATIVE)
  @Get(':id')
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.getPropertyByIdUseCase.execute(new GetPropertyByIdQuery(id));
    return { message: 'Propiedad encontrada', data: mapProperty(property) };
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.deletePropertyUseCase.execute(new DeletePropertyCommand(id));
    return { message: 'Propiedad eliminada con éxito' };
  }
}
