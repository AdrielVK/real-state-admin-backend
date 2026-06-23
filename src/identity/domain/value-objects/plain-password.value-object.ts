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
      throw new DomainException('Password must be a string', ErrorCode.VALIDATION_ERROR);
    }
    if (password.length < MIN_LENGTH) {
      throw new DomainException(
        'Password must be at least 8 characters',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!UPPERCASE_REGEX.test(password)) {
      throw new DomainException(
        'Password must contain at least one uppercase letter',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!LOWERCASE_REGEX.test(password)) {
      throw new DomainException(
        'Password must contain at least one lowercase letter',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    if (!SYMBOL_REGEX.test(password)) {
      throw new DomainException(
        'Password must contain at least one symbol',
        ErrorCode.VALIDATION_ERROR,
      );
    }
    return new PlainPassword(password);
  }

  get value(): string {
    return this.props.value;
  }
}
