import { DomainException, ErrorCode, ValueObject, type ValueObjectProps } from '@shared/domain';

export interface PropertyInternalIdProps extends ValueObjectProps {
  value: string;
}

const EXACT_LENGTH = 7;
const ALPHANUMERIC_REGEX = /^[A-Z0-9]{7}$/;

export class PropertyInternalId extends ValueObject<PropertyInternalIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): PropertyInternalId {
    if (typeof raw !== 'string') {
      throw new DomainException(
        'El internalId debe ser una cadena de texto',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    const value = raw.trim().toUpperCase();
    if (value.length !== EXACT_LENGTH || !ALPHANUMERIC_REGEX.test(value)) {
      throw new DomainException(
        'El internalId debe tener exactamente 7 caracteres alfanuméricos en mayúsculas',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    return new PropertyInternalId(value);
  }

  get value(): string {
    return this.props.value;
  }
}
