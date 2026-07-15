import 'reflect-metadata';

import { ErrorCode } from '@shared/domain';
import { AppException } from '@shared/presentation';

import { Property } from '../../domain/entities/property.aggregate';
import { ConservationState } from '../../domain/enums/conservation-state.enum';
import { PropertyStatus } from '../../domain/enums/property-status.enum';
import { PropertyType } from '../../domain/enums/property-type.enum';
import type { IPropertyInternalIdGenerator } from '../../domain/ports/internal-id-generator.interface';
import type {
  AddressResolution,
  IPlaceResolver,
} from '../../domain/ports/place-resolver.interface';
import type { IPropertyRepository } from '../../domain/ports/property-repository.interface';
import { CreatePropertyHandler } from '../commands/create-property.handler';
import {
  CreatePropertyDto,
  PropertyAddressDto,
  PropertyFeaturesDto,
} from '../dto/create-property.dto';

const addressResolution: AddressResolution = {
  placeId: 'place-mock-001',
  formatted: 'Av. Corrientes 1234, CABA, Argentina',
  street: 'Av. Corrientes',
  streetNumber: '1234',
  floor: null,
  apartment: null,
  neighborhood: 'San Nicolás',
  city: 'CABA',
  province: 'Buenos Aires',
  country: 'Argentina',
  postalCode: 'C1043',
  latitude: -34.6037,
  longitude: -58.3816,
};

function makeAddressDto(): PropertyAddressDto {
  const dto = new PropertyAddressDto();
  dto.placeId = 'place-mock-001';
  dto.formatted = 'Av. Corrientes 1234, CABA, Argentina';
  dto.latitude = -34.6037;
  dto.longitude = -58.3816;
  return dto;
}

function makeFeaturesDto(): PropertyFeaturesDto {
  const dto = new PropertyFeaturesDto();
  dto.propertyType = PropertyType.DEPARTAMENTO;
  dto.conservationState = ConservationState.BUENO;
  dto.bedrooms = 2;
  dto.bathrooms = 1;
  dto.serviceTags = ['gas_natural'];
  dto.amenityTags = ['pileta'];
  return dto;
}

function makeDto(overrides: Partial<{ internalId: string }> = {}): CreatePropertyDto {
  const dto = new CreatePropertyDto();
  dto.address = makeAddressDto();
  dto.features = makeFeaturesDto();
  if (overrides.internalId !== undefined) {
    dto.internalId = overrides.internalId;
  }
  return dto;
}

function makeMockPlaceResolver(
  overrides: Partial<jest.Mocked<IPlaceResolver>> = {},
): jest.Mocked<IPlaceResolver> {
  return {
    resolveAddress: jest.fn().mockResolvedValue(addressResolution),
    ...overrides,
  } as jest.Mocked<IPlaceResolver>;
}

function makeMockInternalIdGenerator(): jest.Mocked<IPropertyInternalIdGenerator> {
  return {
    generate: jest.fn().mockReturnValue('RANDOM7'),
  } as jest.Mocked<IPropertyInternalIdGenerator>;
}

function makeMockPropertyRepository(): jest.Mocked<IPropertyRepository> {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findByInternalId: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation(async (property: Property) => property),
  } as jest.Mocked<IPropertyRepository>;
}

function makeHandler() {
  const placeResolver = makeMockPlaceResolver();
  const internalIdGenerator = makeMockInternalIdGenerator();
  const propertyRepository = makeMockPropertyRepository();
  const handler = new CreatePropertyHandler(placeResolver, internalIdGenerator, propertyRepository);
  return { handler, placeResolver, internalIdGenerator, propertyRepository };
}

describe('CreatePropertyHandler', () => {
  describe('execute() — success path', () => {
    it('should resolve the address via IPlaceResolver', async () => {
      const { handler, placeResolver } = makeHandler();
      await handler.execute(makeDto());
      expect(placeResolver.resolveAddress).toHaveBeenCalledTimes(1);
      expect(placeResolver.resolveAddress).toHaveBeenCalledWith('place-mock-001');
    });

    it('should generate an internalId via IPropertyInternalIdGenerator when none is supplied', async () => {
      const { handler, internalIdGenerator } = makeHandler();
      const result = await handler.execute(makeDto());
      expect(internalIdGenerator.generate).toHaveBeenCalledTimes(1);
      expect(result.internalId).toBe('RANDOM7');
    });

    it('should use the supplied internalId when provided', async () => {
      const { handler, internalIdGenerator } = makeHandler();
      const result = await handler.execute(makeDto({ internalId: 'A1B2C3D' }));
      expect(internalIdGenerator.generate).not.toHaveBeenCalled();
      expect(result.internalId).toBe('A1B2C3D');
    });

    it('should persist the property via IPropertyRepository.save()', async () => {
      const { handler, propertyRepository } = makeHandler();
      await handler.execute(makeDto());
      expect(propertyRepository.save).toHaveBeenCalledTimes(1);
      const savedArg = propertyRepository.save.mock.calls[0]?.[0] as Property;
      expect(savedArg).toBeInstanceOf(Property);
      expect(savedArg.address.placeId).toBe('place-mock-001');
    });

    it('should use the address resolved by the place resolver, not the DTO', async () => {
      const { handler } = makeHandler();
      const result = await handler.execute(makeDto());
      expect(result.placeId).toBe('place-mock-001');
    });

    it('should set the property status to DISPONIBLE on creation', async () => {
      const { handler, propertyRepository } = makeHandler();
      await handler.execute(makeDto());
      const savedArg = propertyRepository.save.mock.calls[0]?.[0] as Property;
      expect(savedArg.status).toBe(PropertyStatus.DISPONIBLE);
    });
  });

  describe('execute() — failure paths', () => {
    it('should throw AppException INVALID_ADDRESS when the place resolver rejects the placeId', async () => {
      const { handler, placeResolver } = makeHandler();
      placeResolver.resolveAddress.mockRejectedValue(
        new AppException(ErrorCode.INVALID_ADDRESS, 'No se pudo resolver'),
      );
      await expect(handler.execute(makeDto())).rejects.toBeInstanceOf(AppException);
    });

    it('should not persist when the address resolution fails', async () => {
      const { handler, placeResolver, propertyRepository } = makeHandler();
      placeResolver.resolveAddress.mockRejectedValue(
        new AppException(ErrorCode.INVALID_ADDRESS, 'No se pudo resolver'),
      );
      await expect(handler.execute(makeDto())).rejects.toThrow();
      expect(propertyRepository.save).not.toHaveBeenCalled();
    });

    it('should throw AppException DUPLICATE_INTERNAL_ID when the repository rejects the internalId', async () => {
      const { handler, propertyRepository } = makeHandler();
      propertyRepository.save.mockRejectedValue(
        new AppException(
          ErrorCode.DUPLICATE_INTERNAL_ID,
          'Ya existe una propiedad con ese internalId',
        ),
      );
      await expect(handler.execute(makeDto({ internalId: 'DUP0001' }))).rejects.toMatchObject({
        code: ErrorCode.DUPLICATE_INTERNAL_ID,
      });
    });

    it('should throw AppException VALIDATION_ERROR when the supplied internalId is malformed', async () => {
      const { handler } = makeHandler();
      const dto = makeDto();
      // 6 chars is too short — the internalId must be exactly 7 alphanumeric chars.
      (dto as { internalId: string }).internalId = 'short1';
      await expect(handler.execute(dto)).rejects.toBeInstanceOf(AppException);
    });
  });
});
