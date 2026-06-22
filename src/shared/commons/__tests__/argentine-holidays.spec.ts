import { ArgentineDate } from '../argentine-date';
import { isArgentineHoliday, isBusinessDay } from '../argentine-holidays';

describe('ArgentineHolidays', () => {
  describe('isArgentineHoliday()', () => {
    it('should recognize New Year (Jan 1)', () => {
      const date = ArgentineDate.fromISO('2024-01-01');
      expect(isArgentineHoliday(date)).toBe(true);
    });

    it('should recognize Independence Day (Jul 9)', () => {
      const date = ArgentineDate.fromISO('2024-07-09');
      expect(isArgentineHoliday(date)).toBe(true);
    });

    it('should recognize Christmas (Dec 25)', () => {
      const date = ArgentineDate.fromISO('2024-12-25');
      expect(isArgentineHoliday(date)).toBe(true);
    });

    it('should return false for regular days', () => {
      const date = ArgentineDate.fromISO('2024-03-15');
      expect(isArgentineHoliday(date)).toBe(false);
    });
  });

  describe('isBusinessDay()', () => {
    it('should return false for weekends', () => {
      const saturday = ArgentineDate.fromISO('2024-01-06'); // Saturday
      const sunday = ArgentineDate.fromISO('2024-01-07'); // Sunday
      expect(isBusinessDay(saturday)).toBe(false);
      expect(isBusinessDay(sunday)).toBe(false);
    });

    it('should return false for holidays', () => {
      const date = ArgentineDate.fromISO('2024-01-01'); // New Year
      expect(isBusinessDay(date)).toBe(false);
    });

    it('should return true for regular weekdays', () => {
      const date = ArgentineDate.fromISO('2024-01-02'); // Tuesday
      expect(isBusinessDay(date)).toBe(true);
    });
  });
});
