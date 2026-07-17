import { Test, type TestingModule } from '@nestjs/testing';

import { CreatePropertyUseCase } from '../../application/commands/create-property.use-case';
import { DeletePropertyUseCase } from '../../application/commands/delete-property.use-case';
import { EditPropertyAddressUseCase } from '../../application/commands/edit-property-address.use-case';
import { GetPropertyByIdUseCase } from '../../application/queries/get-property-by-id.use-case';
import { ListAllPropertiesUseCase } from '../../application/queries/list-all-properties.use-case';
import { ListMyPropertiesUseCase } from '../../application/queries/list-my-properties.use-case';
import { Property } from '../../domain/entities/property.aggregate';
import { CharacteristicCategory } from '../../domain/enums/characteristic-category.enum';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../../domain/value-objects/property-characteristic.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import type { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { PropertiesController } from '../controllers/properties.controller';

function makeMockUseCase() {
  return {
    execute: jest.fn(),
  } as jest.Mocked<Pick<CreatePropertyUseCase, 'execute'>>;
}

function makeProperty(createdByUserId: string | null = 'user-uuid-1'): Property {
  return Property.reconstitute({
    id: new PropertyId('550e8400-e29b-41d4-a716-446655440000'),
    internalCode: 'PROP-001',
    address: new PropertyAddress({
      addressPlaceId: null,
      addressFormatted: 'Calle 1, CABA',
      addressStreet: 'Calle 1',
      addressStreetNumber: '100',
      addressNeighborhood: 'Centro',
      addressCity: 'CABA',
      addressState: 'Buenos Aires',
      addressCountry: 'Argentina',
      addressPostalCode: 'C1000',
      addressLatitude: -34.6037,
      addressLongitude: -58.3816,
    }),
    propertyType: PropertyType.DEPARTAMENTO,
    status: PropertyStatus.DISPONIBLE,
    features: new PropertyFeatures({
      totalAreaM2: 100,
      coveredAreaM2: 80,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      garages: 0,
      floor: 2,
      conservationState: ConservationState.BUENO,
      ageYears: 5,
    }),
    ownerProfileId: null,
    agentProfileId: null,
    createdByUserId,
    characteristics: [
      PropertyCharacteristicValue.fromPersistence(
        1,
        'Piscina',
        'piscina',
        CharacteristicCategory.AMENIDAD,
      ),
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    deletedAt: null,
  });
}

describe('PropertiesController', () => {
  let controller: PropertiesController;
  let useCase: jest.Mocked<Pick<CreatePropertyUseCase, 'execute'>>;
  let listAllUseCase: jest.Mocked<Pick<ListAllPropertiesUseCase, 'execute'>>;
  let listMyUseCase: jest.Mocked<Pick<ListMyPropertiesUseCase, 'execute'>>;
  let editAddressUseCase: jest.Mocked<Pick<EditPropertyAddressUseCase, 'execute'>>;

  beforeEach(async () => {
    useCase = makeMockUseCase();
    listAllUseCase = { execute: jest.fn() } as jest.Mocked<
      Pick<ListAllPropertiesUseCase, 'execute'>
    >;
    listMyUseCase = { execute: jest.fn() } as jest.Mocked<Pick<ListMyPropertiesUseCase, 'execute'>>;
    editAddressUseCase = { execute: jest.fn() } as jest.Mocked<
      Pick<EditPropertyAddressUseCase, 'execute'>
    >;
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: CreatePropertyUseCase, useValue: useCase },
        { provide: DeletePropertyUseCase, useValue: { execute: jest.fn() } },
        { provide: EditPropertyAddressUseCase, useValue: editAddressUseCase },
        { provide: GetPropertyByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: ListAllPropertiesUseCase, useValue: listAllUseCase },
        { provide: ListMyPropertiesUseCase, useValue: listMyUseCase },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  it('should create a property and return the response DTO with creatorId from request', async () => {
    const property = makeProperty('user-uuid-create');
    useCase.execute.mockResolvedValue(property);

    const req = { user: { sub: 'user-uuid-create', email: 'u@e.com', role: 'AGENT' } };
    const result = await controller.create(
      {
        internalCode: 'PROP-001',
        propertyType: PropertyType.DEPARTAMENTO,
        address: {
          addressFormatted: 'Calle 1, CABA',
          addressCity: 'CABA',
          addressCountry: 'Argentina',
        },
      } as never,
      req as never,
    );

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ dto: expect.anything(), creatorId: 'user-uuid-create' }),
    );

    expect(result.message).toBe('Propiedad creada con éxito');
    const body = result.data;
    expect(body.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(body.internalCode).toBe('PROP-001');
    expect(body.status).toBe('disponible');
    expect(body.propertyType).toBe('departamento');
    expect(body.createdByUserId).toBe('user-uuid-create');
    expect(body.address.formatted).toBe('Calle 1, CABA');
    expect(body.address.city).toBe('CABA');
    expect(body.address.latitude).toBe(-34.6037);
    expect(body.address.longitude).toBe(-58.3816);
    expect(body.characteristics).toHaveLength(1);
    expect(body.characteristics[0]?.id).toBe(1);
    expect(body.characteristics[0]?.name).toBe('Piscina');
    expect(body.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(body.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    expect(body.deletedAt).toBeNull();
    expect(body.features).not.toBeNull();
    expect(body.features?.totalAreaM2).toBe(100);
    expect(body.features?.coveredAreaM2).toBe(80);
    expect(body.features?.rooms).toBe(3);
  });

  it('should list all properties when GET /properties is called (admin)', async () => {
    listAllUseCase.execute.mockResolvedValue({
      data: [makeProperty('user-uuid-1')],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const result = await controller.listAll({ page: 1, limit: 10 } as PaginationQueryDto);

    expect(listAllUseCase.execute).toHaveBeenCalledTimes(1);
    expect(listAllUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it('should list the user own properties when GET /properties/me is called', async () => {
    listMyUseCase.execute.mockResolvedValue({
      data: [makeProperty('user-uuid-1')],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    const req: { user: { sub: string; email: string; role: string } } = {
      user: { sub: 'user-uuid-1', email: 'u@e.com', role: 'AGENT' },
    };

    const result = await controller.listMy(req, { page: 1, limit: 10 } as PaginationQueryDto);

    expect(listMyUseCase.execute).toHaveBeenCalledTimes(1);
    expect(listMyUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ createdByUserId: 'user-uuid-1', page: 1, limit: 10 }),
    );
    expect(result.data).toHaveLength(1);
  });

  it('should return empty data and meta.total=0 when user has no properties', async () => {
    listMyUseCase.execute.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    const req: { user: { sub: string; email: string; role: string } } = {
      user: { sub: 'user-no-props', email: 'u@e.com', role: 'AGENT' },
    };

    const result = await controller.listMy(req, { page: 1, limit: 10 } as PaginationQueryDto);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('should update a property address via PATCH :id/address and return the updated property', async () => {
    const property = makeProperty('user-uuid-1');
    editAddressUseCase.execute.mockResolvedValue(property);

    const result = await controller.editAddress('550e8400-e29b-41d4-a716-446655440000', {
      addressFormatted: 'Av. Santa Fe 2500',
      addressCity: 'CABA',
      addressCountry: 'Argentina',
      addressStreet: 'Av. Santa Fe',
      addressStreetNumber: '2500',
      addressNeighborhood: 'Palermo',
      addressState: 'Buenos Aires',
      addressPostalCode: 'C1425',
      addressLatitude: -34.595,
      addressLongitude: -58.397,
    } as never);

    expect(editAddressUseCase.execute).toHaveBeenCalledTimes(1);
    const callArg = editAddressUseCase.execute.mock.calls[0]?.[0] as {
      propertyId: string;
      dto: { addressFormatted: string; addressCity: string; addressCountry: string };
    };
    expect(callArg.propertyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(callArg.dto.addressFormatted).toBe('Av. Santa Fe 2500');
    expect(callArg.dto.addressCity).toBe('CABA');
    expect(callArg.dto.addressCountry).toBe('Argentina');
    expect(result.message).toBe('Dirección actualizada con éxito');
    expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.data.address.formatted).toBe('Calle 1, CABA');
  });

  it('should propagate NOT_FOUND from the use case when the property does not exist', async () => {
    editAddressUseCase.execute.mockRejectedValue(new Error('Property with id "missing" not found'));

    await expect(
      controller.editAddress('00000000-0000-4000-8000-000000000000', {
        addressFormatted: 'Cualquier calle 100',
        addressCity: 'CABA',
        addressCountry: 'Argentina',
      } as never),
    ).rejects.toThrow(/Property with id/);
  });
});
