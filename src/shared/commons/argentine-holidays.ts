import type { ArgentineDate } from './argentine-date';

const FIXED_HOLIDAYS: Array<{ month: number; day: number }> = [
  { month: 1, day: 1 }, // New Year
  { month: 3, day: 24 }, // Memory Day
  { month: 5, day: 1 }, // Labor Day
  { month: 5, day: 25 }, // May Revolution
  { month: 6, day: 20 }, // Flag Day
  { month: 7, day: 9 }, // Independence Day
  { month: 12, day: 8 }, // Immaculate Conception
  { month: 12, day: 25 }, // Christmas
];

export function isArgentineHoliday(date: ArgentineDate): boolean {
  return FIXED_HOLIDAYS.some((h) => h.month === date.month && h.day === date.day);
}

export function isBusinessDay(date: ArgentineDate): boolean {
  // weekday: 1=Monday, 7=Sunday
  if (date.weekday === 6 || date.weekday === 7) {
    return false;
  }
  return !isArgentineHoliday(date);
}
