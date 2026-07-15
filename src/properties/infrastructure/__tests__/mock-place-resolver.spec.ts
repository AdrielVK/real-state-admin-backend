import { DomainException, ErrorCode } from '@shared/domain';

import { MockPlaceResolver } from '../adapters/mock-place-resolver';

describe('MockPlaceResolver', () => {
  let resolver: MockPlaceResolver;

  beforeEach(() => {
    resolver = new MockPlaceResolver();
  });

  it('should resolve a known placeId to a valid AddressResolution', async () => {
    const result = await resolver.resolveAddress('place-mock-001');
    expect(result.placeId).toBe('place-mock-001');
    expect(result.formatted).toBe('Av. Corrientes 1234, CABA, Argentina');
    expect(result.latitude).toBeCloseTo(-34.6037, 4);
    expect(result.longitude).toBeCloseTo(-58.3816, 4);
    expect(result.street).toBe('Av. Corrientes');
  });

  it('should resolve different placeIds to different addresses', async () => {
    const a = await resolver.resolveAddress('place-mock-001');
    const b = await resolver.resolveAddress('place-mock-002');
    expect(a.placeId).not.toBe(b.placeId);
    expect(a.city).toBe('CABA');
    expect(b.city).toBe('Springfield');
  });

  it('should resolve a placeId that has floor and apartment', async () => {
    const result = await resolver.resolveAddress('place-mock-003');
    expect(result.floor).toBe('8');
    expect(result.apartment).toBe('B');
  });

  it('should throw DomainException INVALID_ADDRESS for an unknown placeId', async () => {
    await expect(resolver.resolveAddress('unknown-place')).rejects.toThrow(DomainException);
    try {
      await resolver.resolveAddress('unknown-place');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainException);
      expect((error as DomainException).code).toBe(ErrorCode.INVALID_ADDRESS);
    }
  });

  it('should throw DomainException INVALID_ADDRESS for empty placeId', async () => {
    await expect(resolver.resolveAddress('')).rejects.toThrow(DomainException);
  });
});
