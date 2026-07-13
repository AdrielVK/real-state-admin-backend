import { DomainException, ErrorCode, ValueObject, type ValueObjectProps } from '@shared/domain';

interface PlainPasswordProps extends ValueObjectProps {
  value: string;
}

const MIN_LENGTH = 8;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const SYMBOL_REGEX = /[^a-zA-Z0-9]/;

export class PlainPassword extends ValueObject<PlainPasswordProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(password: string): PlainPassword {
    if (typeof password !== 'string') {
      throw new DomainException(
        'La contraseña debe ser una cadena de texto',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (password.length < MIN_LENGTH) {
      throw new DomainException(
        'La contraseña debe tener al menos 8 caracteres',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!UPPERCASE_REGEX.test(password)) {
      throw new DomainException(
        'La contraseña debe contener al menos una mayúscula',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!LOWERCASE_REGEX.test(password)) {
      throw new DomainException(
        'La contraseña debe contener al menos una minúscula',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!SYMBOL_REGEX.test(password)) {
      throw new DomainException(
        'La contraseña debe contener al menos un símbolo',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    return new PlainPassword(password);
  }

  get value(): string {
    return this.props.value;
  }
}
