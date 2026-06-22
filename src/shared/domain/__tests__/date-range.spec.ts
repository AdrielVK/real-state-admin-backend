import { DateRange } from '../value-objects/date-range.value-object';

describe('DateRange', () => {
  it('should create a DateRange with start and end', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');
    const range = new DateRange(start, end);
    expect(range.start).toEqual(start);
    expect(range.end).toEqual(end);
  });

  it('should throw if end is before start', () => {
    const start = new Date('2024-12-31');
    const end = new Date('2024-01-01');
    expect(() => new DateRange(start, end)).toThrow('End date must be after start date');
  });

  it('should be equal to another DateRange with same dates', () => {
    const r1 = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
    const r2 = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
    expect(r1.equals(r2)).toBe(true);
  });

  it('should NOT be equal with different dates', () => {
    const r1 = new DateRange(new Date('2024-01-01'), new Date('2024-06-30'));
    const r2 = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
    expect(r1.equals(r2)).toBe(false);
  });

  it('should check if a date is contained in the range', () => {
    const range = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
    expect(range.contains(new Date('2024-06-15'))).toBe(true);
    expect(range.contains(new Date('2025-01-01'))).toBe(false);
  });

  it('should check if another range overlaps', () => {
    const r1 = new DateRange(new Date('2024-01-01'), new Date('2024-06-30'));
    const r2 = new DateRange(new Date('2024-03-01'), new Date('2024-12-31'));
    expect(r1.overlaps(r2)).toBe(true);
  });

  it('should detect non-overlapping ranges', () => {
    const r1 = new DateRange(new Date('2024-01-01'), new Date('2024-03-31'));
    const r2 = new DateRange(new Date('2024-06-01'), new Date('2024-12-31'));
    expect(r1.overlaps(r2)).toBe(false);
  });
});
