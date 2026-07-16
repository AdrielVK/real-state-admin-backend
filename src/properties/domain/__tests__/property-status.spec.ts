import { PropertyStatus } from '../enums/property-status.enum';

describe('PropertyStatus', () => {
  it('should expose the original status values', () => {
    expect(PropertyStatus.DISPONIBLE).toBe('disponible');
    expect(PropertyStatus.RESERVADA).toBe('reservada');
    expect(PropertyStatus.VENDIDA).toBe('vendida');
    expect(PropertyStatus.ALQUILADA).toBe('alquilada');
    expect(PropertyStatus.EN_PROCESO).toBe('en_proceso');
  });

  it('should expose NO_DISPONIBLE as a valid status', () => {
    expect(PropertyStatus.NO_DISPONIBLE).toBe('no_disponible');
  });

  it('should not overlap the new status with the existing ones', () => {
    const values = Object.values(PropertyStatus);
    expect(values).toContain('no_disponible');
    expect(new Set(values).size).toBe(values.length);
  });
});
