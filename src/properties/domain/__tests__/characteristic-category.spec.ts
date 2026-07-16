import { CharacteristicCategory } from '../enums/characteristic-category.enum';

describe('CharacteristicCategory', () => {
  it('should expose the four category values', () => {
    expect(CharacteristicCategory.SERVICIO).toBe('servicio');
    expect(CharacteristicCategory.AMENIDAD).toBe('amenidad');
    expect(CharacteristicCategory.CONDICION).toBe('condicion');
    expect(CharacteristicCategory.MATERIAL).toBe('material');
  });

  it('should only contain the expected four entries', () => {
    expect(Object.values(CharacteristicCategory).sort()).toEqual([
      'amenidad',
      'condicion',
      'material',
      'servicio',
    ]);
  });
});
