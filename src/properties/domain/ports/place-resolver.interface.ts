export interface AddressResolution {
  placeId: string;
  formatted: string;
  street: string | null;
  streetNumber: string | null;
  floor: string | null;
  apartment: string | null;
  neighborhood: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}

export interface IPlaceResolver {
  resolveAddress(placeId: string): Promise<AddressResolution>;
}

export const IPlaceResolverToken = Symbol('IPlaceResolver');
