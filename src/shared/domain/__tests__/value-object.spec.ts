import { ValueObject } from '../value-objects/value-object';

interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }
}

describe('ValueObject', () => {
  it('should be equal to another ValueObject with the same properties', () => {
    const money1 = new Money({ amount: 100, currency: 'ARS' });
    const money2 = new Money({ amount: 100, currency: 'ARS' });
    expect(money1.equals(money2)).toBe(true);
  });

  it('should NOT be equal to another ValueObject with different properties', () => {
    const money1 = new Money({ amount: 100, currency: 'ARS' });
    const money2 = new Money({ amount: 200, currency: 'ARS' });
    expect(money1.equals(money2)).toBe(false);
  });

  it('should NOT be equal when currency differs', () => {
    const money1 = new Money({ amount: 100, currency: 'ARS' });
    const money2 = new Money({ amount: 100, currency: 'USD' });
    expect(money1.equals(money2)).toBe(false);
  });

  it('should NOT be equal to null or undefined', () => {
    const money = new Money({ amount: 100, currency: 'ARS' });
    expect(money.equals(null)).toBe(false);
    expect(money.equals(undefined as unknown as Money)).toBe(false);
  });

  it('should expose props immutably', () => {
    const money = new Money({ amount: 100, currency: 'ARS' });
    expect(money.amount).toBe(100);
    expect(money.currency).toBe('ARS');
  });
});
