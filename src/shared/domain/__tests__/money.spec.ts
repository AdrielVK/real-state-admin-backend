import { Money } from '../value-objects/money.value-object';

describe('Money', () => {
  it('should create a Money value object', () => {
    const money = new Money(100, 'ARS');
    expect(money.amount).toBe(100);
    expect(money.currency).toBe('ARS');
  });

  it('should be equal to another Money with same amount and currency', () => {
    const m1 = new Money(100, 'ARS');
    const m2 = new Money(100, 'ARS');
    expect(m1.equals(m2)).toBe(true);
  });

  it('should NOT be equal with different amounts', () => {
    const m1 = new Money(100, 'ARS');
    const m2 = new Money(200, 'ARS');
    expect(m1.equals(m2)).toBe(false);
  });

  it('should NOT be equal with different currencies', () => {
    const m1 = new Money(100, 'ARS');
    const m2 = new Money(100, 'USD');
    expect(m1.equals(m2)).toBe(false);
  });

  it('should add two Money values with the same currency', () => {
    const m1 = new Money(100, 'ARS');
    const m2 = new Money(50, 'ARS');
    const sum = m1.add(m2);
    expect(sum.amount).toBe(150);
    expect(sum.currency).toBe('ARS');
  });

  it('should throw when adding different currencies', () => {
    const m1 = new Money(100, 'ARS');
    const m2 = new Money(50, 'USD');
    expect(() => m1.add(m2)).toThrow('Cannot add money with different currencies');
  });

  it('should subtract two Money values with the same currency', () => {
    const m1 = new Money(100, 'ARS');
    const m2 = new Money(30, 'ARS');
    const diff = m1.subtract(m2);
    expect(diff.amount).toBe(70);
    expect(diff.currency).toBe('ARS');
  });

  it('should throw when subtracting different currencies', () => {
    const m1 = new Money(100, 'ARS');
    const m2 = new Money(30, 'USD');
    expect(() => m1.subtract(m2)).toThrow('Cannot subtract money with different currencies');
  });
});
