import { ValueObject, type ValueObjectProps } from './value-object';

interface DateRangeProps extends ValueObjectProps {
  start: Date;
  end: Date;
}

export class DateRange extends ValueObject<DateRangeProps> {
  constructor(start: Date, end: Date) {
    if (end < start) {
      throw new Error('End date must be after start date');
    }
    super({ start, end });
  }

  get start(): Date {
    return this.props.start;
  }

  get end(): Date {
    return this.props.end;
  }

  equals(other: ValueObject<DateRangeProps>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return (
      this.start.getTime() === other.props.start.getTime() &&
      this.end.getTime() === other.props.end.getTime()
    );
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }

  overlaps(other: DateRange): boolean {
    return this.start <= other.end && other.start <= this.end;
  }
}
