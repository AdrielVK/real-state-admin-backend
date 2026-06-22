import { ValueObject, type ValueObjectProps } from '@shared/domain';

interface UserEmailProps extends ValueObjectProps {
  value: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserEmail extends ValueObject<UserEmailProps> {
  constructor(value: string) {
    if (!EMAIL_REGEX.test(value)) {
      throw new Error('Invalid email format');
    }
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
