import { Test, type TestingModule } from '@nestjs/testing';

import {
  CreatePropertyCommand,
  CreatePropertyUseCase,
} from '../../application/commands/create-property.use-case';
import { DeletePropertyUseCase } from '../../application/commands/delete-property.use-case';
import { GetPropertyByIdUseCase } from '../../application/queries/get-property-by-id.use-case';
import { Property } from '../../domain/entities/property.aggregate';
import { CharacteristicCategory } from '../../domain/enums/characteristic-category.enum';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import { PropertyAddress } from '../../domain/value-objects/property-address.value-object';
import { PropertyCharacteristicValue } from '../../domain/value-objects/property-characteristic.value-object';
import { PropertyFeatures } from '../../domain/value-objects/property-features.value-object';
import { PropertyId } from '../../domain/value-objects/property-id.value-object';
import { PropertiesController } from '../controllers/properties.controller';

function makeMockUseCase() {
  return {
    execute: jest.fn(),
  } as jest.Mocked<Pick<CreatePropertyUseCase, 'execute'>>;
}

function makeProperty(): Property {
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

  beforeEach(async () => {
    useCase = makeMockUseCase();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [
        { provide: CreatePropertyUseCase, useValue: useCase },
        { provide: DeletePropertyUseCase, useValue: { execute: jest.fn() } },
        { provide: GetPropertyByIdUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PropertiesController>(PropertiesController);
  });

  it('should create a property and return the response DTO', async () => {
    const property = makeProperty();
    useCase.execute.mockResolvedValue(property);

    // The @Body() decorator will validate and transform, but we test the controller method directly
    const result = await controller.create({
      internalCode: 'PROP-001',
      propertyType: PropertyType.DEPARTAMENTO,
      address: {
        addressFormatted: 'Calle 1, CABA',
        addressCity: 'CABA',
        addressCountry: 'Argentina',
      },
    } as never);

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith(expect.any(CreatePropertyCommand));

    expect(result.message).toBe('Propiedad creada con éxito');
    const body = result.data;
    expect(body.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(body.internalCode).toBe('PROP-001');
    expect(body.status).toBe('disponible');
    expect(body.propertyType).toBe('departamento');
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
});
