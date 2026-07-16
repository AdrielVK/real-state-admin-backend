import { CharacteristicCategory } from '../enums/characteristic-category.enum';
import { PropertyCharacteristicValue } from '../value-objects/property-characteristic.value-object';

describe('PropertyCharacteristicValue', () => {
  it('should build a characteristic from explicit props', () => {
    const characteristic = new PropertyCharacteristicValue({
      id: 1,
      name: 'Piscina',
      slug: 'piscina',
      category: CharacteristicCategory.AMENIDAD,
    });

    expect(characteristic.id).toBe(1);
    expect(characteristic.name).toBe('Piscina');
    expect(characteristic.slug).toBe('piscina');
    expect(characteristic.category).toBe(CharacteristicCategory.AMENIDAD);
  });

  it('should support fromCreate factory with id: null', () => {
    const characteristic = PropertyCharacteristicValue.fromCreate(
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );

    expect(characteristic.id).toBeNull();
    expect(characteristic.name).toBe('Piscina');
    expect(characteristic.slug).toBe('piscina');
    expect(characteristic.category).toBe(CharacteristicCategory.AMENIDAD);
  });

  it('should support fromPersistence factory with numeric id', () => {
    const characteristic = PropertyCharacteristicValue.fromPersistence(
      42,
      'Gas natural',
      'gas-natural',
      CharacteristicCategory.SERVICIO,
    );

    expect(characteristic.id).toBe(42);
    expect(characteristic.name).toBe('Gas natural');
    expect(characteristic.slug).toBe('gas-natural');
    expect(characteristic.category).toBe(CharacteristicCategory.SERVICIO);
  });

  it('should be equal to another characteristic with the same props', () => {
    const a = PropertyCharacteristicValue.fromPersistence(
      1,
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    const b = PropertyCharacteristicValue.fromPersistence(
      1,
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    expect(a.equals(b)).toBe(true);
  });

  it('should NOT be equal when id differs', () => {
    const a = PropertyCharacteristicValue.fromPersistence(
      1,
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    const b = PropertyCharacteristicValue.fromPersistence(
      2,
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    expect(a.equals(b)).toBe(false);
  });

  it('should NOT be equal when one is fromCreate (id: null) and the other is fromPersistence', () => {
    const a = PropertyCharacteristicValue.fromCreate(
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    const b = PropertyCharacteristicValue.fromPersistence(
      1,
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    expect(a.equals(b)).toBe(false);
  });

  it('should be equal between two fromCreate() calls with the same props', () => {
    const a = PropertyCharacteristicValue.fromCreate(
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    const b = PropertyCharacteristicValue.fromCreate(
      'Piscina',
      'piscina',
      CharacteristicCategory.AMENIDAD,
    );
    expect(a.equals(b)).toBe(true);
  });

  it('should normalize slug: trim, lowercase, spaces to dashes', () => {
    const characteristic = PropertyCharacteristicValue.fromCreate(
      'Seguridad 24hs',
      '  Seguridad  24hs  ',
      CharacteristicCategory.SERVICIO,
    );

    expect(characteristic.slug).toBe('seguridad-24hs');
  });

  it('should normalize uppercase and mixed-case slugs to lowercase', () => {
    const a = PropertyCharacteristicValue.fromCreate(
      'Piscina Climatizada',
      'Piscina-Climatizada',
      CharacteristicCategory.AMENIDAD,
    );
    const b = PropertyCharacteristicValue.fromCreate(
      'Piscina Climatizada',
      'piscina-climatizada',
      CharacteristicCategory.AMENIDAD,
    );

    expect(a.slug).toBe('piscina-climatizada');
    expect(b.slug).toBe('piscina-climatizada');
    expect(a.equals(b)).toBe(true);
  });
});
