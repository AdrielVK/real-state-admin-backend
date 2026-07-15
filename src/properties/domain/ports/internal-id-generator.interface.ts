export interface IPropertyInternalIdGenerator {
  generate(): string;
}

export const IPropertyInternalIdGeneratorToken = Symbol('IPropertyInternalIdGenerator');
