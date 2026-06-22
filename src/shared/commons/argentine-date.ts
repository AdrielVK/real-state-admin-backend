import { DateTime, type DurationUnit } from 'luxon';

import { ValueObject, type ValueObjectProps } from '@shared/domain';

import { AR_DEFAULT_FORMAT, AR_LOCALE, AR_TIMEZONE } from './constants';

interface ArgentineDateProps extends ValueObjectProps {
  iso: string;
}

export class ArgentineDate extends ValueObject<ArgentineDateProps> {
  private readonly _dateTime: DateTime;

  private constructor(dateTime: DateTime) {
    super({ iso: dateTime.toISO() ?? '' });
    this._dateTime = dateTime;
  }

  static now(): ArgentineDate {
    return new ArgentineDate(DateTime.now().setZone(AR_TIMEZONE).setLocale(AR_LOCALE));
  }

  static fromISO(iso: string): ArgentineDate {
    const dt = DateTime.fromISO(iso, { zone: AR_TIMEZONE, locale: AR_LOCALE });
    if (!dt.isValid) {
      throw new Error(`Invalid ISO date: ${iso}`);
    }
    return new ArgentineDate(dt);
  }

  format(fmt: string = AR_DEFAULT_FORMAT): string {
    return this._dateTime.toFormat(fmt);
  }

  addDays(days: number): ArgentineDate {
    return new ArgentineDate(this._dateTime.plus({ days }));
  }

  addMonths(months: number): ArgentineDate {
    return new ArgentineDate(this._dateTime.plus({ months }));
  }

  isBefore(other: ArgentineDate): boolean {
    return this._dateTime < other._dateTime;
  }

  isAfter(other: ArgentineDate): boolean {
    return this._dateTime > other._dateTime;
  }

  difference(other: ArgentineDate, unit: DurationUnit = 'days'): number {
    return this._dateTime.diff(other._dateTime, unit).get(unit);
  }

  toISO(): string {
    return this._dateTime.toISO() ?? '';
  }

  get zone(): string {
    return this._dateTime.zoneName ?? AR_TIMEZONE;
  }

  get locale(): string {
    return this._dateTime.locale ?? AR_LOCALE;
  }

  get year(): number {
    return this._dateTime.year;
  }

  get month(): number {
    return this._dateTime.month;
  }

  get day(): number {
    return this._dateTime.day;
  }

  get weekday(): number {
    return this._dateTime.weekday;
  }
}
