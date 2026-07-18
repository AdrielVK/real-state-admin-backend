import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { UserRole } from '@shared/domain';
import { type PaginationMeta, Roles } from '@shared/presentation';

interface AuthenticatedUser {
  sub: string;
  email: string;
  role: string;
}

import {
  CreatePropertyCommand,
  CreatePropertyUseCase,
} from '../../application/commands/create-property.use-case';
import {
  DeletePropertyCommand,
  DeletePropertyUseCase,
} from '../../application/commands/delete-property.use-case';
import {
  EditPropertyAddressCommand,
  EditPropertyAddressUseCase,
} from '../../application/commands/edit-property-address.use-case';
import {
  EditPropertyAgentCommand,
  EditPropertyAgentUseCase,
} from '../../application/commands/edit-property-agent.use-case';
import {
  EditPropertyCharacteristicsCommand,
  EditPropertyCharacteristicsUseCase,
} from '../../application/commands/edit-property-characteristics.use-case';
import {
  EditPropertyFeaturesCommand,
  EditPropertyFeaturesUseCase,
} from '../../application/commands/edit-property-features.use-case';
import {
  EditPropertyStatusCommand,
  EditPropertyStatusUseCase,
} from '../../application/commands/edit-property-status.use-case';
import { CreatePropertyDto } from '../../application/dto/create-property.dto';
import { EditPropertyAddressDto } from '../../application/dto/edit-property-address.dto';
import { EditPropertyAgentDto } from '../../application/dto/edit-property-agent.dto';
import { EditPropertyCharacteristicsDto } from '../../application/dto/edit-property-characteristics.dto';
import { EditPropertyFeaturesDto } from '../../application/dto/edit-property-features.dto';
import { EditPropertyStatusDto } from '../../application/dto/edit-property-status.dto';
import {
  GetPropertyByIdQuery,
  GetPropertyByIdUseCase,
} from '../../application/queries/get-property-by-id.use-case';
import {
  ListAllPropertiesQuery,
  ListAllPropertiesUseCase,
  type PaginatedPropertiesResult,
} from '../../application/queries/list-all-properties.use-case';
import {
  ListMyPropertiesQuery,
  ListMyPropertiesUseCase,
} from '../../application/queries/list-my-properties.use-case';
import type { Property, PropertyCharacteristicValue } from '../../domain';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

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
  createdByUserId: string | null;
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
    createdByUserId: property.createdByUserId,
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

function mapPaginated(result: PaginatedPropertiesResult): {
  data: PropertyResponse[];
  meta: PaginationMeta;
} {
  return {
    data: result.data.map((p) => mapProperty(p)),
    meta: result.meta,
  };
}

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly getPropertyByIdUseCase: GetPropertyByIdUseCase,
    private readonly deletePropertyUseCase: DeletePropertyUseCase,
    private readonly editPropertyAddressUseCase: EditPropertyAddressUseCase,
    private readonly editPropertyAgentUseCase: EditPropertyAgentUseCase,
    private readonly editPropertyCharacteristicsUseCase: EditPropertyCharacteristicsUseCase,
    private readonly editPropertyFeaturesUseCase: EditPropertyFeaturesUseCase,
    private readonly editPropertyStatusUseCase: EditPropertyStatusUseCase,
    private readonly listAllPropertiesUseCase: ListAllPropertiesUseCase,
    private readonly listMyPropertiesUseCase: ListMyPropertiesUseCase,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.ADMINISTRATIVE)
  @Post()
  @HttpCode(201)
  async create(
    @Body() dto: CreatePropertyDto,
    @Req() req: { user: AuthenticatedUser },
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.createPropertyUseCase.execute(
      new CreatePropertyCommand(dto, req.user.sub),
    );
    return { message: 'Propiedad creada con éxito', data: mapProperty(property) };
  }

  // CRITICAL: this @Get() must be declared BEFORE @Get(':id') so NestJS does not
  // attempt to parse the literal "me" as a UUID route parameter.
  @Roles(UserRole.ADMIN)
  @Get()
  async listAll(
    @Query() pagination: PaginationQueryDto,
  ): Promise<{ data: PropertyResponse[]; meta: PaginationMeta }> {
    const result = await this.listAllPropertiesUseCase.execute(
      new ListAllPropertiesQuery(pagination.page, pagination.limit),
    );
    return mapPaginated(result);
  }

  // CRITICAL: this @Get('me') must be declared BEFORE @Get(':id') so NestJS does not
  // attempt to parse the literal "me" as a UUID route parameter.
  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.ADMINISTRATIVE)
  @Get('me')
  async listMy(
    @Req() req: { user: AuthenticatedUser },
    @Query() pagination: PaginationQueryDto,
  ): Promise<{ data: PropertyResponse[]; meta: PaginationMeta }> {
    const result = await this.listMyPropertiesUseCase.execute(
      new ListMyPropertiesQuery(req.user.sub, pagination.page, pagination.limit),
    );
    return mapPaginated(result);
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

  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Patch(':id/address')
  async editAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditPropertyAddressDto,
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.editPropertyAddressUseCase.execute(
      new EditPropertyAddressCommand(id, dto),
    );
    return { message: 'Dirección actualizada con éxito', data: mapProperty(property) };
  }

  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Patch(':id/characteristics')
  async editCharacteristics(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditPropertyCharacteristicsDto,
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.editPropertyCharacteristicsUseCase.execute(
      new EditPropertyCharacteristicsCommand(id, dto),
    );
    return { message: 'Características actualizadas con éxito', data: mapProperty(property) };
  }

  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Patch(':id/features')
  async editFeatures(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditPropertyFeaturesDto,
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.editPropertyFeaturesUseCase.execute(
      new EditPropertyFeaturesCommand(id, dto),
    );
    return {
      message: 'Características físicas actualizadas con éxito',
      data: mapProperty(property),
    };
  }

  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.ADMINISTRATIVE)
  @Patch(':id/status')
  async editStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditPropertyStatusDto,
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.editPropertyStatusUseCase.execute(
      new EditPropertyStatusCommand(id, dto),
    );
    return { message: 'Estado actualizado con éxito', data: mapProperty(property) };
  }

  @Roles(UserRole.ADMIN, UserRole.AGENT, UserRole.ADMINISTRATIVE)
  @Patch(':id/agent')
  async editAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditPropertyAgentDto,
  ): Promise<{ message: string; data: PropertyResponse }> {
    const property = await this.editPropertyAgentUseCase.execute(
      new EditPropertyAgentCommand(id, dto),
    );
    return { message: 'Agente actualizado con éxito', data: mapProperty(property) };
  }
}
