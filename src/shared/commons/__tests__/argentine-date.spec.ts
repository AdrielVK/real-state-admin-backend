import { ArgentineDate } from '../argentine-date';

describe('ArgentineDate', () => {
  describe('now()', () => {
    it('should return current date in Argentine timezone', () => {
      const date = ArgentineDate.now();
      expect(date).toBeInstanceOf(ArgentineDate);
    });

    it('should use America/Argentina/Buenos_Aires timezone', () => {
      const date = ArgentineDate.now();
      expect(date.zone).toBe('America/Argentina/Buenos_Aires');
    });
  });

  describe('fromISO()', () => {
    it('should parse ISO date string', () => {
      const date = ArgentineDate.fromISO('2024-01-15T12:00:00Z');
      expect(date).toBeInstanceOf(ArgentineDate);
    });

    it('should format as dd/MM/yyyy by default', () => {
      const date = ArgentineDate.fromISO('2024-01-15T12:00:00Z');
      expect(date.format()).toBe('15/01/2024');
    });
  });

  describe('format()', () => {
    it('should format with default dd/MM/yyyy', () => {
      const date = ArgentineDate.fromISO('2024-06-20');
      expect(date.format()).toBe('20/06/2024');
    });

    it('should format with custom format', () => {
      const date = ArgentineDate.fromISO('2024-06-20');
      expect(date.format('yyyy-MM-dd')).toBe('2024-06-20');
    });
  });

  describe('addDays()', () => {
    it('should add days immutably', () => {
      const original = ArgentineDate.fromISO('2024-01-01');
      const result = original.addDays(3);
      expect(result.format()).toBe('04/01/2024');
      expect(original.format()).toBe('01/01/2024');
    });

    it('should handle negative days', () => {
      const date = ArgentineDate.fromISO('2024-01-10');
      const result = date.addDays(-5);
      expect(result.format()).toBe('05/01/2024');
    });
  });

  describe('addMonths()', () => {
    it('should add months immutably', () => {
      const original = ArgentineDate.fromISO('2024-01-15');
      const result = original.addMonths(2);
      expect(result.format()).toBe('15/03/2024');
      expect(original.format()).toBe('15/01/2024');
    });
  });

  describe('comparison', () => {
    it('isBefore should return true when date is before other', () => {
      const dateA = ArgentineDate.fromISO('2024-01-01');
      const dateB = ArgentineDate.fromISO('2024-01-02');
      expect(dateA.isBefore(dateB)).toBe(true);
    });

    it('isAfter should return true when date is after other', () => {
      const dateA = ArgentineDate.fromISO('2024-01-02');
      const dateB = ArgentineDate.fromISO('2024-01-01');
      expect(dateA.isAfter(dateB)).toBe(true);
    });

    it('difference should return days between dates', () => {
      const dateA = ArgentineDate.fromISO('2024-01-01');
      const dateB = ArgentineDate.fromISO('2024-01-10');
      expect(dateA.difference(dateB, 'days')).toBe(-9);
    });
  });

  describe('immutability', () => {
    it('should return new instance on addDays', () => {
      const date = ArgentineDate.fromISO('2024-01-01');
      const result = date.addDays(1);
      expect(result).not.toBe(date);
    });

    it('should return new instance on addMonths', () => {
      const date = ArgentineDate.fromISO('2024-01-01');
      const result = date.addMonths(1);
      expect(result).not.toBe(date);
    });
  });
});
