import { ValueObject, type ValueObjectProps } from '@shared/domain';

import type { CharacteristicCategory } from '../enums/characteristic-category.enum';

export interface PropertyCharacteristicProps extends ValueObjectProps {
  id: number | null;
  name: string;
  slug: string;
  category: CharacteristicCategory;
}

export class PropertyCharacteristicValue extends ValueObject<PropertyCharacteristicProps> {
  static fromCreate(
    name: string,
    slug: string,
    category: CharacteristicCategory,
  ): PropertyCharacteristicValue {
    const normalized = slug.trim().toLowerCase().replaceAll(/\s+/g, '-');
    return new PropertyCharacteristicValue({ id: null, name, slug: normalized, category });
  }

  static fromPersistence(
    id: number,
    name: string,
    slug: string,
    category: CharacteristicCategory,
  ): PropertyCharacteristicValue {
    return new PropertyCharacteristicValue({ id, name, slug, category });
  }

  get id(): number | null {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get category(): CharacteristicCategory {
    return this.props.category;
  }
}
