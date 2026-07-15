import { Injectable } from '@nestjs/common';

import { DomainException, ErrorCode } from '@shared/domain';

import type {
  AddressResolution,
  IPlaceResolver,
} from '../../domain/ports/place-resolver.interface';

const SUPPORTED_PLACE_IDS = new Set<string>(['place-mock-001', 'place-mock-002', 'place-mock-003']);

const MOCK_RESOLUTIONS: Record<string, AddressResolution> = {
  'place-mock-001': {
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
  },
  'place-mock-002': {
    placeId: 'place-mock-002',
    formatted: 'Calle Falsa 123, Springfield, USA',
    street: 'Calle Falsa',
    streetNumber: '123',
    floor: null,
    apartment: null,
    neighborhood: 'Downtown',
    city: 'Springfield',
    province: 'Illinois',
    country: 'USA',
    postalCode: '62701',
    latitude: 39.7817,
    longitude: -89.6501,
  },
  'place-mock-003': {
    placeId: 'place-mock-003',
    formatted: 'Av. 9 de Julio 1925, CABA, Argentina',
    street: 'Av. 9 de Julio',
    streetNumber: '1925',
    floor: '8',
    apartment: 'B',
    neighborhood: 'San Nicolás',
    city: 'CABA',
    province: 'Buenos Aires',
    country: 'Argentina',
    postalCode: 'C1043',
    latitude: -34.6047,
    longitude: -58.3826,
  },
};

@Injectable()
export class MockPlaceResolver implements IPlaceResolver {
  async resolveAddress(placeId: string): Promise<AddressResolution> {
    // The interface is async to keep the contract compatible with a future
    // HTTP-based Google Places adapter; the mock resolves synchronously.
    await Promise.resolve();

    if (!placeId || !SUPPORTED_PLACE_IDS.has(placeId)) {
      throw new DomainException(
        `No se pudo resolver la dirección para placeId "${placeId}"`,
        ErrorCode.INVALID_ADDRESS,
      );
    }
    const resolution = MOCK_RESOLUTIONS[placeId];
    // The lookup above guarantees a hit when supported, but defensive check
    // keeps the noUnnecessaryCondition rule satisfied.

    if (!resolution) {
      throw new DomainException(
        `No se pudo resolver la dirección para placeId "${placeId}"`,
        ErrorCode.INVALID_ADDRESS,
      );
    }
    return resolution;
  }
}
